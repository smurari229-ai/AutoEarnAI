import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { getAuthenticatedUser, getSupabaseClient, getUserScopedClient } from './server/supabase';

dotenv.config();

// Persistent Supabase state is the financial source of truth. No in-memory balances/transactions are used.\n\n// Lazy-initialized Gemini instance
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateGeminiContentWithRetry(
  prompt: string,
  systemInstruction?: string,
  fallbackGenerator?: () => string
): Promise<string> {
  const ai = getGeminiClient();

  if (ai) {
    // Try gemini-2.5-flash first for high stability & throughput, followed by gemini-3.7-flash
    const candidateModels = ['gemini-2.5-flash', 'gemini-3.7-flash'];

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: systemInstruction ? { systemInstruction } : undefined,
        });

        if (response && response.text && response.text.trim().length > 0) {
          return response.text.trim();
        }
      } catch (err: any) {
        // Silently fall through to the next candidate model or fallback generator
        continue;
      }
    }
  }

  // Gracefully return procedural domain fallback if API is busy or unconfigured
  return fallbackGenerator ? fallbackGenerator() : 'Generated automated deliverable successfully.';
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Vercel/production proxy awareness: rate limiting must use the real client IP.
  app.set('trust proxy', 1);

  // Security headers and a bounded JSON body protect every API route.
  app.disable('x-powered-by');
  app.use((_req: Request, res: Response, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // Preserve the exact webhook bytes so provider signatures can be verified against the raw body.
  // No webhook is trusted yet; the route below still rejects unconfigured providers.
  app.use(express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
    },
  } as any));

  // --- AUTH ENDPOINTS ---
  // OTP delivery/verification is delegated to Supabase Auth. AutoEarnAI never returns an OTP.
  const authRate = new Map<string, { count: number; resetAt: number }>();
  const checkRateLimit = (key: string, max: number, windowMs: number): boolean => {
    const now = Date.now();
    const current = authRate.get(key);
    if (!current || current.resetAt <= now) {
      authRate.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (current.count >= max) return false;
    current.count += 1;
    return true;
  };

  const clientIp = (req: Request) => req.ip || req.socket.remoteAddress || 'unknown';
  const normalizePhone = (value: string) => {
    const digits = value.replace(/\\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    return value.trim();
  };

  app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
    const type = String(req.body?.type || '').trim().toLowerCase();
    const identifier = String(req.body?.identifier || '').trim();
    if (!['email', 'phone'].includes(type) || !identifier) {
      return res.status(400).json({ error: 'Valid email or phone is required', code: 'INVALID_AUTH_INPUT' });
    }
    const normalized = type === 'phone' ? normalizePhone(identifier) : identifier.toLowerCase();
    const key = `otp-send:${clientIp(req)}:${type}:${normalized}`;
    if (!checkRateLimit(key, 5, 15 * 60 * 1000)) {
      return res.status(429).json({ error: 'Too many OTP requests. Try again later.', code: 'OTP_RATE_LIMITED' });
    }

    const client = getSupabaseClient();
    if (!client) return res.status(503).json({ error: 'Authentication provider is not configured', code: 'AUTH_PROVIDER_NOT_CONFIGURED' });

    const credentials = type === 'email' ? { email: normalized } : { phone: normalized };
    const { error } = await client.auth.signInWithOtp({
      ...credentials,
      options: { shouldCreateUser: true, data: { full_name: String(req.body?.name || '').trim().slice(0, 120) || undefined } }
    });
    if (error) return res.status(502).json({ error: 'Unable to send verification code', code: 'OTP_SEND_FAILED' });
    return res.json({ success: true, message: 'Verification code sent.' });
  });

  app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
    const type = String(req.body?.type || '').trim().toLowerCase();
    const identifier = String(req.body?.identifier || '').trim();
    const token = String(req.body?.token || '').trim();
    if (!['email', 'phone'].includes(type) || !identifier || !/^\\d{6}$/.test(token)) {
      return res.status(400).json({ error: 'Valid identifier and 6-digit verification code are required', code: 'INVALID_AUTH_INPUT' });
    }
    const normalized = type === 'phone' ? normalizePhone(identifier) : identifier.toLowerCase();
    const key = `otp-verify:${clientIp(req)}:${type}:${normalized}`;
    if (!checkRateLimit(key, 10, 15 * 60 * 1000)) {
      return res.status(429).json({ error: 'Too many verification attempts. Try again later.', code: 'OTP_VERIFY_RATE_LIMITED' });
    }

    const client = getSupabaseClient();
    if (!client) return res.status(503).json({ error: 'Authentication provider is not configured', code: 'AUTH_PROVIDER_NOT_CONFIGURED' });

    const verifyInput = type === 'email'
      ? { email: normalized, token, type: 'email' as const }
      : { phone: normalized, token, type: 'sms' as const };
    const { data, error } = await client.auth.verifyOtp(verifyInput);
    if (error || !data.user || !data.session) {
      return res.status(401).json({ error: 'Invalid or expired verification code', code: 'OTP_INVALID_OR_EXPIRED' });
    }

    return res.json({
      success: true,
      user: data.user,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
      }
    });
  });

  // --- WALLET & PAYMENT GATEWAY ENDPOINTS ---
  const financialRate = new Map<string, { count: number; resetAt: number }>();
  const checkFinancialRate = (req: Request, limit = 30, windowMs = 60_000) => {
    const key = `${clientIp(req)}:${req.path}`;
    const now = Date.now();
    const current = financialRate.get(key);
    if (!current || current.resetAt <= now) { financialRate.set(key, { count: 1, resetAt: now + windowMs }); return true; }
    if (current.count >= limit) return false;
    current.count += 1;
    return true;
  };
  app.use('/api/wallet', (req: Request, res: Response, next) => {
    if (!checkFinancialRate(req, 30, 60_000)) return res.status(429).json({ error: 'Too many wallet requests. Try again later.', code: 'WALLET_RATE_LIMITED' });
    next();
  });
  app.use('/api/payment', (req: Request, res: Response, next) => {
    if (!checkFinancialRate(req, 20, 60_000)) return res.status(429).json({ error: 'Too many payment requests. Try again later.', code: 'PAYMENT_RATE_LIMITED' });
    next();
  });
  app.use('/api/webhooks', (req: Request, res: Response, next) => {
    if (!checkFinancialRate(req, 60, 60_000)) return res.status(429).json({ error: 'Too many webhook requests. Try again later.', code: 'WEBHOOK_RATE_LIMITED' });
    next();
  });
  async function requireUser(req: Request, res: Response) {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
      return null;
    }
    return user;
  }

  app.get('/api/wallet/data', async (req: Request, res: Response) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const client = getUserScopedClient(req);
    if (!client) {
      res.status(503).json({ error: 'Supabase is not configured', code: 'SUPABASE_NOT_CONFIGURED' });
      return;
    }

    const { data: walletData, error: walletInitError } = await client.rpc('ensure_user_wallet');
    if (walletInitError) {
      console.error('[WALLET] wallet initialization failed', walletInitError);
      res.status(500).json({ error: 'Unable to initialize wallet', code: 'WALLET_INIT_FAILED' });
      return;
    }

    const [walletResult, transactionsResult, earningsResult] = await Promise.all([
      client.from('wallets').select('currency,balance_minor,reserved_minor').eq('user_id', user.id).maybeSingle(),
      client.from('wallet_transactions').select('id,type,amount_minor,currency,status,provider,provider_reference,metadata,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      client.from('earnings').select('id,channel,status,amount_minor,currency,provider,provider_reference,metadata,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    ]);

    if (walletResult.error || transactionsResult.error || earningsResult.error) {
      console.error('[WALLET] Supabase read failed', walletResult.error || transactionsResult.error || earningsResult.error);
      res.status(500).json({ error: 'Unable to load wallet data', code: 'WALLET_READ_FAILED' });
      return;
    }

    const walletRow = walletResult.data || walletData;
    const balance = {
      totalBalance: Number(walletRow?.balance_minor ?? 0) / 100,
      todaysEarnings: (earningsResult.data || [])
        .filter((e: any) => e.status === 'credited' && new Date(e.created_at).toDateString() === new Date().toDateString())
        .reduce((sum: number, e: any) => sum + Number(e.amount_minor || 0), 0) / 100,
      totalWithdrawn: Math.abs((transactionsResult.data || [])
        .filter((t: any) => t.type === 'withdrawal' && t.status === 'completed')
        .reduce((sum: number, t: any) => sum + Number(t.amount_minor || 0), 0)) / 100,
      totalDeposited: (transactionsResult.data || [])
        .filter((t: any) => t.type === 'deposit' && t.status === 'completed')
        .reduce((sum: number, t: any) => sum + Number(t.amount_minor || 0), 0) / 100,
      lockedInTrades: Number(walletRow?.reserved_minor ?? 0) / 100,
      currency: '₹',
    };

    const transactions = (transactionsResult.data || []).map((t: any) => ({
      id: t.id,
      type: t.type === 'earning' ? 'ai_earning' : t.type,
      title: t.metadata?.title || `${t.type} transaction`,
      amount: Math.abs(Number(t.amount_minor || 0)) / 100,
      currency: '₹',
      timestamp: new Date(t.created_at).getTime(),
      status: t.status,
      method: t.provider || undefined,
      referenceId: t.provider_reference || t.id,
      notes: t.metadata?.notes,
    }));

    res.json({ balance, transactions, logs: [] });
  });

  app.post('/api/payment/order', async (req: Request, res: Response) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const client = getUserScopedClient(req);
    if (!client) return res.status(503).json({ error: 'Supabase is not configured', code: 'SUPABASE_NOT_CONFIGURED' });

    const amount = Number(req.body?.amount);
    const amountMinor = Math.round(amount * 100);
    const currency = String(req.body?.currency || 'INR').toUpperCase();
    const provider = String(req.body?.provider || '').trim();
    const idempotencyKey = String(req.body?.idempotencyKey || '').trim();

    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0 || currency !== 'INR') {
      return res.status(400).json({ error: 'Invalid amount or currency', code: 'INVALID_PAYMENT_ORDER' });
    }
    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 128) {
      return res.status(400).json({ error: 'Valid idempotency key is required', code: 'INVALID_IDEMPOTENCY_KEY' });
    }
    if (!provider) {
      return res.status(503).json({ error: 'Payment provider is not configured. No payment was created.', code: 'PAYMENT_PROVIDER_NOT_CONFIGURED' });
    }

    const { data, error } = await client.from('payment_orders').insert({
      user_id: user.id,
      amount_minor: amountMinor,
      currency,
      status: 'pending',
      provider,
      idempotency_key: idempotencyKey,
      metadata: { source: 'api/payment/order' }
    }).select('id,amount_minor,currency,status,provider,idempotency_key,created_at').single();

    if (error) {
      const duplicate = String(error.message || '').toLowerCase().includes('duplicate');
      return res.status(duplicate ? 409 : 500).json({
        error: duplicate ? 'Duplicate payment order' : 'Unable to create payment order',
        code: duplicate ? 'PAYMENT_ORDER_DUPLICATE' : 'PAYMENT_ORDER_CREATE_FAILED'
      });
    }

    return res.status(201).json({ order: data, payment: null, status: 'pending' });
  });

  app.post('/api/webhooks/:provider', async (req: Request, res: Response) => {
    const provider = String(req.params.provider || '').trim().toLowerCase();
    if (!provider) return res.status(400).json({ error: 'Provider is required', code: 'INVALID_PROVIDER' });

    // Provider-specific signature verification MUST be implemented before this endpoint can
    // mutate payment state. We intentionally reject all unverified webhook traffic.
    const signature = String(req.header('x-webhook-signature') || '').trim();
    if (!signature) {
      return res.status(401).json({ error: 'Webhook signature required', code: 'WEBHOOK_SIGNATURE_REQUIRED' });
    }

    return res.status(501).json({
      error: 'Provider webhook verification is not configured. No payment or wallet state was changed.',
      code: 'WEBHOOK_PROVIDER_NOT_CONFIGURED',
      provider
    });
  });

  // Real payment integration is intentionally blocked until a verified provider/webhook is configured.
  app.post('/api/wallet/deposit', (_req: Request, res: Response) => {
    res.status(503).json({
      error: 'Deposit provider is not configured. No balance was changed.',
      code: 'PAYMENT_PROVIDER_NOT_CONFIGURED'
    });
  });

  // Creates only a user-owned withdrawal request. Reservation and payout require trusted execution.
  app.post('/api/wallet/withdraw-request', async (req: Request, res: Response) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const client = getUserScopedClient(req);
    if (!client) return res.status(503).json({ error: 'Supabase is not configured', code: 'SUPABASE_NOT_CONFIGURED' });

    const amountMinor = Number(req.body?.amountMinor);
    const method = String(req.body?.method || '').trim().toLowerCase();
    const destination = req.body?.destination && typeof req.body.destination === 'object' ? req.body.destination : {};
    const idempotencyKey = String(req.header('idempotency-key') || req.body?.idempotencyKey || '').trim();

    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive integer minor-unit value', code: 'INVALID_WITHDRAWAL_AMOUNT' });
    }
    if (!['upi', 'bank', 'crypto'].includes(method)) {
      return res.status(400).json({ error: 'Unsupported withdrawal method', code: 'INVALID_WITHDRAWAL_METHOD' });
    }
    if (idempotencyKey.length < 8 || idempotencyKey.length > 128) {
      return res.status(400).json({ error: 'A valid idempotency key is required', code: 'INVALID_IDEMPOTENCY_KEY' });
    }

    const { data, error } = await client.from('withdrawal_requests').insert({
      user_id: user.id,
      amount_minor: amountMinor,
      currency: 'INR',
      method,
      destination,
      status: 'requested',
      idempotency_key: idempotencyKey
    }).select('id,amount_minor,currency,method,status,idempotency_key,created_at').single();

    if (error) {
      const duplicate = String(error.message || '').toLowerCase().includes('duplicate');
      return res.status(duplicate ? 409 : 500).json({
        error: duplicate ? 'Duplicate withdrawal request' : 'Unable to create withdrawal request',
        code: duplicate ? 'WITHDRAWAL_REQUEST_DUPLICATE' : 'WITHDRAWAL_REQUEST_FAILED'
      });
    }

    return res.status(201).json({ request: data, status: 'requested', payout: null });
  });

  // Real payout integration is intentionally blocked until a verified provider is configured.
  app.post('/api/wallet/withdraw', (_req: Request, res: Response) => {
    res.status(503).json({
      error: 'Withdrawal provider is not configured. No funds were deducted.',
      code: 'PAYOUT_PROVIDER_NOT_CONFIGURED'
    });
  });

  // Demo capital reset is disabled; financial state must never be reset from the browser.
  app.post('/api/wallet/reset', (_req: Request, res: Response) => {
    res.status(410).json({
      error: 'Demo wallet reset is disabled in production mode.',
      code: 'DEMO_RESET_DISABLED'
    });
  });

  app.get('/api/wallet/transactions', async (req: Request, res: Response) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const client = getUserScopedClient(req);
    if (!client) return res.status(503).json({ error: 'Supabase is not configured', code: 'SUPABASE_NOT_CONFIGURED' });

    const { data, error } = await client
      .from('wallet_transactions')
      .select('id,type,amount_minor,currency,status,provider,provider_reference,metadata,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return res.status(500).json({ error: 'Unable to load transactions', code: 'TRANSACTIONS_READ_FAILED' });
    return res.json({ transactions: data || [] });
  });

  app.get('/api/earnings', async (req: Request, res: Response) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const client = getUserScopedClient(req);
    if (!client) return res.status(503).json({ error: 'Supabase is not configured', code: 'SUPABASE_NOT_CONFIGURED' });

    const { data, error } = await client
      .from('earnings')
      .select('id,channel,status,amount_minor,currency,provider,provider_reference,metadata,created_at,verified_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return res.status(500).json({ error: 'Unable to load earnings', code: 'EARNINGS_READ_FAILED' });
    return res.json({ earnings: data || [] });
  });

  app.post('/api/ai/usage', async (req: Request, res: Response) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const client = getUserScopedClient(req);
    if (!client) return res.status(503).json({ error: 'Supabase is not configured', code: 'SUPABASE_NOT_CONFIGURED' });

    const { data, error } = await client.rpc('increment_ai_usage');
    if (error) return res.status(500).json({ error: 'Unable to update AI usage', code: 'AI_USAGE_FAILED' });
    return res.json({ usage: data });
  });

  async function requireAiUsage(req: Request, res: Response) {
    const user = await requireUser(req, res);
    if (!user) return null;

    const client = getUserScopedClient(req);
    if (!client) {
      res.status(503).json({ error: 'Supabase is not configured', code: 'SUPABASE_NOT_CONFIGURED' });
      return null;
    }

    const { data, error } = await client.rpc('increment_ai_usage');
    if (error) {
      const isLimit = String(error.message || '').includes('AI_DAILY_LIMIT_REACHED');
      res.status(isLimit ? 429 : 500).json({
        error: isLimit ? 'Daily AI limit reached' : 'Unable to update AI usage',
        code: isLimit ? 'AI_DAILY_LIMIT_REACHED' : 'AI_USAGE_FAILED'
      });
      return null;
    }

    return { user, usage: data };
  }

  // --- AI CONTENT / STRATEGY SIMULATION ---
  // This endpoint never represents real trades, ad revenue, freelance payouts, or wallet earnings.
  app.post('/api/ai/auto-cycle', async (req: Request, res: Response) => {
    const aiContext = await requireAiUsage(req, res);
    if (!aiContext) return;

    const requestedChannels = Array.isArray(req.body?.activeChannels) ? req.body.activeChannels : [];
    const allowedChannels = ['youtube', 'social', 'stock_market', 'freelance', 'news'];
    const channels = requestedChannels.filter((c: unknown): c is string => typeof c === 'string' && allowedChannels.includes(c));
    const chosenChannel = channels[Math.floor(Math.random() * channels.length)] || 'youtube';

    const prompts: Record<string, string> = {
      youtube: 'Create a concise YouTube content idea and hook about AI tools. Do not claim views, CPM, AdSense revenue, or earnings.',
      social: 'Create a concise social-media post idea promoting an AI software workflow. Do not claim clicks, commissions, or earnings.',
      stock_market: 'Create a concise educational trading-analysis checklist for a hypothetical scenario. Do not claim a real trade, price, position, P&L, or investment result.',
      freelance: 'Create a concise freelance proposal outline for an AI/software task. Do not claim an Upwork job, client, contract, milestone, or payout exists.',
      news: 'Create a concise editorial research angle about AI/fintech. Do not claim ad revenue, RPM, traffic, or monetization.',
    };

    try {
      const output = await generateGeminiContentWithRetry(
        prompts[chosenChannel],
        'You are an AI assistant. Produce content or analysis only. Never invent financial outcomes, transactions, clients, trades, revenue, or monetization evidence.',
        () => 'Content/strategy draft generated for review. No real-world transaction or earning is represented.'
      );

      const log = {
        id: 'SIM-' + Date.now(),
        timestamp: Date.now(),
        channel: chosenChannel,
        level: 'info',
        message: 'SIMULATION / DEMO MODE: AI generated content/strategy only. No money was earned, traded, deposited, or withdrawn.',
        profitEarned: 0,
        metadata: { status: 'simulation', financialResult: false }
      };

      return res.json({
        success: true,
        simulation: true,
        status: 'simulation',
        channel: chosenChannel,
        output,
        summary: 'SIMULATION / DEMO MODE — AI content/strategy generated only; no financial result.',
        financialResult: false,
        log,
      });
    } catch (error: any) {
      console.error('AI simulation error:', error);
      return res.status(503).json({ error: 'AI generation unavailable', code: 'AI_GENERATION_FAILED', financialResult: false });
    }
  });

  // --- AI CONTENT GENERATION ---
  // This route can generate content/analysis only. It cannot create or claim financial outcomes.
  app.post('/api/ai/custom-task', async (req: Request, res: Response) => {
    const aiContext = await requireAiUsage(req, res);
    if (!aiContext) return;

    const channel = String(req.body?.channel || 'general').trim().toLowerCase();
    const prompt = String(req.body?.prompt || '').trim().slice(0, 5000);
    const allowedChannels = ['youtube', 'social', 'stock_market', 'freelance', 'news', 'general'];
    if (!allowedChannels.includes(channel) || !prompt) {
      return res.status(400).json({ success: false, error: 'A valid channel and non-empty prompt are required.', code: 'INVALID_AI_INPUT' });
    }

    const channelInstructions: Record<string, string> = {
      youtube: 'Create a YouTube content outline, hook, title ideas, and production checklist. Do not claim views, CPM, AdSense revenue, earnings, sponsors, or results.',
      social: 'Create social-media content ideas, captions, hooks, and a posting checklist. Do not claim clicks, commissions, affiliate revenue, or results.',
      stock_market: 'Create educational market-analysis methodology for a hypothetical scenario. Do not provide or imply executed trades, live positions, guaranteed returns, P&L, or profit figures.',
      freelance: 'Create a freelance proposal, scope, implementation plan, or code outline. Do not claim a real client, job, contract, milestone, payout, or platform earnings.',
      news: 'Create an editorial research angle, outline, or SEO-safe headline ideas. Do not claim traffic, RPM, AdSense revenue, or monetization results.',
      general: 'Create useful software, content, research, or productivity guidance. Do not invent financial outcomes or transactions.',
    };

    try {
      const output = await generateGeminiContentWithRetry(
        channelInstructions[channel] + `\\nUser request: ${prompt}`,
        'You are a safety-first AI content assistant. Generate content, analysis, or suggestions only. Never invent revenue, earnings, balances, payouts, clients, transactions, trades, investment results, views, CPM, RPM, commissions, or other financial evidence. Never present projections as actual results.',
        () => 'Content draft generated for review. No real-world transaction or financial result is represented.'
      );

      return res.json({
        success: true,
        status: 'simulation',
        simulation: true,
        output,
        rewardEarned: 0,
        financialResult: false,
        brainMode: 'safe-content',
        message: 'Content generated. No financial credit, trade, payout, or revenue result was created.'
      });
    } catch (err: any) {
      console.error('Custom task generation failed:', err);
      return res.status(503).json({ success: false, status: 'unavailable', error: 'AI generation failed. No financial credit was created.', code: 'AI_GENERATION_FAILED', financialResult: false });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AutoEarnAI content and strategy server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
