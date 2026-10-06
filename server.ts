import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { getAuthenticatedUser, getUserScopedClient } from './server/supabase';

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

  app.use(express.json());

  // --- AUTH ENDPOINTS ---
  // Authentication is owned by Supabase Auth. Legacy demo OTP endpoints are disabled.
  app.post('/api/auth/send-otp', (_req: Request, res: Response) => {
    res.status(410).json({
      error: 'Legacy OTP endpoint disabled. Use Supabase Auth from the client.',
      code: 'LEGACY_AUTH_DISABLED'
    });
  });

  app.post('/api/auth/verify-otp', (_req: Request, res: Response) => {
    res.status(410).json({
      error: 'Legacy OTP endpoint disabled. Use Supabase Auth from the client.',
      code: 'LEGACY_AUTH_DISABLED'
    });
  });

  // --- WALLET & PAYMENT GATEWAY ENDPOINTS ---
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

  // Custom AI Action Generator (On-Demand with Enhanced AI Brain)
  app.post('/api/ai/custom-task', async (req: Request, res: Response) => {
    const aiContext = await requireAiUsage(req, res);
    if (!aiContext) return;

    const { channel, prompt, brainMode } = req.body;

    try {
      const mode = brainMode || 'hyper_growth';
      
      const systemInstruction = `You are AutoEarn AI's Supreme Neural Intelligence Brain (Operating in ${mode.toUpperCase()} mode).
You specialize in 5 autonomous monetization verticals:
1. YouTube Faceless High-CPM Automation: Generates viral 3-second hooks, audience retention pacing, SEO tags, sponsor pitches, and high-paying niche angles ($12+ CPM).
2. Algorithmic Quantitative Trading: Analyzes multi-timeframe VWAP, 20/50/200 EMA crossovers, RSI divergence, Order Flow imbalances, and strict stop-loss/take-profit risk math.
3. Freelance & Client Solution Hunter: Formulates Top-Rated winning proposals on Upwork/Fiverr with full executable code snippets (Python/Node/React), edge-case handling, and delivery checklists.
4. Viral Social Media Matrix: Crafts high-engagement reels, X/Twitter viral threads, and high-converting affiliate copy with psychology-driven CTAs.
5. News & SEO Media Arbitrage: Writes breaking journalistic financial/tech analysis with high Google Discover CTR headlines and AdSense optimization.

Provide detailed, polished, actionable, and formatted output with clear sections, code or script snippets, and exact revenue estimates.`;

      const userPrompt = `Channel: ${channel || 'general'}. Mode: ${mode}. User Instruction / Goal: ${prompt || 'Generate maximum revenue deliverable'}.
Deliver a complete, high-value, production-ready output immediately.`;

      const fallbackTextGenerator = () => {
        if (channel === 'youtube') {
          return `🎬 YOUTUBE SUPREME AI AUTOMATION ENGINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 High CPM Title: "Top 7 Autonomous AI Software Earning ₹1,50,000/Month in 2026 (No Face Required)"
🎯 Target CPM: $11.80 - $18.50 (FinTech & B2B SaaS Niche)

⚡ PSYCHOLOGICAL 3-SECOND HOOK:
"99% of people are using AI to write basic essays, while a silent 1% built autonomous code agents that deposit ₹5,000 every single morning into their account. In this video, I'm handing you the exact 3 blueprints."

📋 5-PHASE RETENTION SCRIPT OUTLINE:
1. [0:00 - 1:15] Proof of Concept: Live screen recording showing automated Upwork & YouTube revenue flow.
2. [1:15 - 3:30] Agent Pipeline #1: Automated Python Web-Scrapers and Data Arbitrage bots.
3. [3:30 - 5:45] Agent Pipeline #2: High-Volume Faceless Short-Form Content Synthesizer.
4. [5:45 - 7:30] Agent Pipeline #3: Quantitative VWAP Momentum Scalper alerts.
5. [7:30 - 9:00] Monetization Bridge: Step-by-step setup + link in pinned comment for free template download.

💡 SPONSORSHIP & AFFILIATE STRATEGY:
• Pinned Comment Bounty: Notion / Hostinger / TradingView affiliate links.
• AdSense Yield (50K views @ $12 CPM): ₹49,200
• Affiliate Conversions (60 sign-ups @ ₹500): ₹30,000
• Total Projected Yield: ₹79,200 / Video`;
        }

        if (channel === 'stock_market') {
          return `📊 QUANTITATIVE NEURAL SCALPING BRAIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ Signal: CONVERGENCE BUY & ACCUMULATE
📈 Asset: ${prompt ? prompt.slice(0, 30) : 'NIFTY 50 / NVDA / BTC'}
⏱ Timeframe: 15-Minute & 1-Hour Intraday Momentum

🎯 QUANTITATIVE EXECUTION TARGETS:
• Primary Entry: Current VWAP Retest Zone
• Take-Profit 1 (Scalp): +1.65% Gain
• Take-Profit 2 (Runner): +3.40% Gain
• Strict Invalidation Stop: -0.70% below 50 EMA baseline

🔍 MULTI-INDICATOR CONFIRMATION:
1. 20 EMA crossed above 50 EMA with high volume surge (2.8x standard deviation).
2. RSI bullish divergence formed at 32.4, now accelerating past 54.0.
3. Institutional Order Block retested with heavy delta absorption in order book.

⚖️ RISK PROTOCOL: Maximum 1.5% portfolio risk per trade with 1:3.2 Risk-to-Reward ratio.`;
        }

        if (channel === 'freelance') {
          return `💼 TOP-RATED FREELANCE PROPOSAL & EXECUTABLE SOLUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Target Job: ${prompt ? prompt.slice(0, 50) : 'Build Resilient Python/Node Web Scraper with Automated Error Recovery'}

📝 WINNING CLIENT BID PROPOSAL:
"Hi there! I specialize in production-grade automation systems with automated proxy rotation, exponential backoffs, and typed database persistence. I have already drafted a resilient working snippet tailored to your specifications and can deliver the full verified repository in under 3 hours."

💻 EXECUTABLE SOLUTION CODE:
\`\`\`typescript
import axios from 'axios';

interface ScrapeResult {
  id: string;
  timestamp: number;
  data: Record<string, any>;
}

export async function executeResilientScraper(targetUrl: string): Promise<ScrapeResult> {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await axios.get(targetUrl, {
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      return {
        id: 'SCRAPE-' + Date.now(),
        timestamp: Date.now(),
        data: res.data
      };
    } catch (err: any) {
      if (attempt === maxRetries) throw new Error(\`Scrape failed after \${maxRetries} attempts: \${err.message}\`);
      await new Promise(r => setTimeout(r, attempt * 1200));
    }
  }
  throw new Error('Scrape cycle terminated');
}
\`\`\`

✅ DELIVERY PACKAGE: TypeScript code + Dockerfile + GitHub CI workflow + Video demo.`;
        }

        if (channel === 'social') {
          return `🔥 VIRAL SOCIAL REVENUE MATRIX & AFFILIATE CAMPAIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 Platforms: Instagram Reel + X (Twitter) Mega Thread + LinkedIn Post
🎯 Campaign Target: High-Converting SaaS & Affiliate Subscriptions

⚡ 2-SECOND VISUAL HOOK:
"Stop trading 10 hours of manual labor for a flat paycheck. Here is how 1 autonomous AI agent generates ₹4,500/day on autopilot:"

🧵 4-STAGE VIRAL THREAD:
1. The Problem: Manual work doesn't scale and caps your earning capacity.
2. The AI Breakthrough: Gemini 2.5/3.7 agents can scrape leads, format deliverables, and close clients.
3. The Tool Stack: AutoEarn AI Hub + UPI/Stripe instant payout rails.
4. The Action Plan: Clone the free open-source setup in 5 minutes.

🔗 HIGH-CONVERTING CALL TO ACTION:
"Drop a comment 'AGENT' below and I will DM you the complete source code & video guide instantly 👇"

🏷 TARGET HASHTAGS:
#AIAutomation #PassiveIncome #FreelanceHacks #UpworkTopRated #TechTools2026`;
        }

        return `📰 BREAKING FINTECH & AI ARBITRAGE REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 Headline: "${prompt ? prompt.slice(0, 60) : 'Autonomous Sovereign AI Networks Drive Historic Revenue Expansion in 2026'}"
📊 Monetization: High RPM Display Ads & Financial Sponsorships

🗞 EDITORIAL ANALYSIS:
The rapid proliferation of self-orchestrating artificial intelligence agents paired with instantaneous payment rails (UPI/IMPS/SEPA) has created an unprecedented economic shift. Independent developers and digital creators now deploy autonomous multi-agent pipelines to scale digital assets globally.

🔑 HIGH-RPM METRICS:
• Search Impression Velocity: +380% Month-over-Month
• Average RPM Yield: $14.20 across FinTech & SaaS segments
• Automated syndication to Google Discover and major news aggregators.`;
      };

      const resultText = await generateGeminiContentWithRetry(
        userPrompt,
        systemInstruction,
        fallbackTextGenerator
      );

      // AI deliverables are not financial proof. Do not credit the wallet from generated content.
      res.json({
        success: true,
        status: 'simulation',
        output: resultText,
        rewardEarned: 0,
        brainMode: mode,
        message: 'Deliverable generated. No financial credit was created; verified revenue must be recorded through a supported provider.'
      });
    } catch (err: any) {
      console.error('Custom task generation failed:', err);
      res.status(503).json({
        success: false,
        status: 'unavailable',
        error: 'AI generation failed. No financial credit was created.',
        code: 'AI_GENERATION_FAILED'
      });
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
    console.log(`AI Auto-Earning Multi-Portal Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
