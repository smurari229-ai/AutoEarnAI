import React, { useState, useEffect, useRef } from 'react';
import { 
  Navbar 
} from './components/Navbar';
import { 
  AuthModal 
} from './components/AuthModal';
import { 
  WalletModal 
} from './components/WalletModal';
import { 
  CommandCenter 
} from './components/CommandCenter';
import { 
  YouTubePortal 
} from './components/YouTubePortal';
import { 
  SocialPortal 
} from './components/SocialPortal';
import { 
  StockMarketPortal 
} from './components/StockMarketPortal';
import { 
  FreelancePortal 
} from './components/FreelancePortal';
import { 
  NewsPortal 
} from './components/NewsPortal';
import { 
  RealAutoStudio 
} from './components/RealAutoStudio';
import { 
  UserProfile, 
  WalletState, 
  AgentLog, 
  AutoPilotSettings, 
  ChannelType 
} from './types';
import confetti from 'canvas-confetti';
import { supabase } from './lib/supabase';

export default function App() {
  // Authentication State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Active Workspace Portal
  const [activePortal, setActivePortal] = useState<string>('dashboard');

  // Wallet & Ledger State
  const [wallet, setWallet] = useState<WalletState>({
    totalBalance: 0,
    todaysEarnings: 0,
    totalWithdrawn: 0,
    totalDeposited: 0,
    lockedInTrades: 0,
    currency: '₹',
    transactions: [],
  });

  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletModalInitialTab, setWalletModalInitialTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');

  // Auto-Pilot Engine Settings
  const [isAutoPilotActive, setIsAutoPilotActive] = useState<boolean>(false);
  const [isProcessingCycle, setIsProcessingCycle] = useState<boolean>(false);
  const [settings, setSettings] = useState<AutoPilotSettings>({
    isEnabled: false,
    frequencySeconds: 15,
    activeChannels: {
      youtube: true,
      social: true,
      stock_market: true,
      freelance: true,
      news: true,
    },
    riskLevel: 'moderate',
    autoReinvest: true,
    dailyEarningTarget: 10000,
  });

  const autoPilotTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial state from server
  const fetchWalletData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch('/api/wallet/data', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.balance) {
          setWallet({
            ...data.balance,
            transactions: data.transactions || [],
          });
        }
        if (data.logs) {
          setLogs(data.logs);
        }
      }
    } catch (err) {
      console.error('Wallet sync failed; no client-side financial fallback is allowed.', err);
    }
  };

  useEffect(() => {
    let mounted = true;
    const syncAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session?.user) {
        setUser(null);
        return;
      }
      const authUser = session.user;
      setUser({
        id: authUser.id,
        phoneNumber: authUser.phone ?? '',
        email: authUser.email ?? undefined,
        name: (authUser.user_metadata?.full_name as string | undefined) || authUser.email?.split('@')[0] || 'AutoEarn User',
        createdAt: new Date(authUser.created_at).getTime(),
        isVerified: true,
        kycStatus: 'unverified',
      });
      void fetchWalletData();
    };
    void syncAuth();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }
      const authUser = session.user;
      setUser({
        id: authUser.id,
        phoneNumber: authUser.phone ?? '',
        email: authUser.email ?? undefined,
        name: (authUser.user_metadata?.full_name as string | undefined) || authUser.email?.split('@')[0] || 'AutoEarn User',
        createdAt: new Date(authUser.created_at).getTime(),
        isVerified: true,
        kycStatus: 'unverified',
      });
      void fetchWalletData();
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // AI content/strategy simulation engine
  const runAutoCycle = async () => {
    if (isProcessingCycle) return;
    setIsProcessingCycle(true);

    try {
      const activeChannelsList = Object.entries(settings.activeChannels)
        .filter(([_, isEnabled]) => isEnabled)
        .map(([channel]) => channel);

      if (activeChannelsList.length === 0) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch('/api/ai/auto-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          activeChannels: activeChannelsList,
          riskLevel: settings.riskLevel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.log) {
          setLogs(prev => [data.log, ...prev.slice(0, 49)]);
        }
        if (data.output) {
          setLogs(prev => [{
            id: 'AI-' + Date.now(),
            timestamp: Date.now(),
            channel: data.channel,
            level: 'info',
            message: data.summary || 'SIMULATION / DEMO MODE: AI content generated; no financial result.',
            profitEarned: 0,
            metadata: { status: 'simulation', output: data.output },
          }, ...prev.slice(0, 49)]);
        }
      }
    } catch (err) {
      console.error('Auto-cycle error:', err);
    } finally {
      setIsProcessingCycle(false);
    }
  };

  // Simulation/strategy interval poller (disabled by default; never credits money)
  useEffect(() => {
    if (autoPilotTimerRef.current) clearInterval(autoPilotTimerRef.current);

    if (isAutoPilotActive) {
      autoPilotTimerRef.current = setInterval(() => {
        runAutoCycle();
      }, settings.frequencySeconds * 1000);
    }

    return () => {
      if (autoPilotTimerRef.current) clearInterval(autoPilotTimerRef.current);
    };
  }, [isAutoPilotActive, settings.frequencySeconds, settings.activeChannels, settings.riskLevel]);

  // Auth Handlers
  const handleLoginSuccess = (newUser: UserProfile, _token: string) => {
    setUser(newUser);
    void fetchWalletData();
  };

  const handleLogout = () => {
    void supabase.auth.signOut();
    setUser(null);
  };

  // Wallet Handlers
  const handleDepositSuccess = async (amount: number, method: string, details?: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Authentication required');
    const res = await fetch('/api/wallet/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ amount, method, ...details }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Deposit failed');
    }
    const data = await res.json();
    setWallet(prev => ({
      ...data.updatedBalance,
      transactions: [data.transaction, ...prev.transactions],
    }));
    await fetchWalletData();
  };

  const handleWithdrawSuccess = async (amount: number, method: string, destination: string, extra?: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Authentication required');

    const idempotencyKey = crypto.randomUUID();
    const res = await fetch('/api/wallet/withdraw-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        amountMinor: Math.round(amount * 100),
        method,
        destination: { value: destination, ...extra },
        idempotencyKey,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Withdrawal request failed');

    // A request does not deduct or reserve funds in the browser. Trusted payout processing does that later.
    await fetchWalletData();
  };

  const handleResetBalance = async () => {
    throw new Error('Demo wallet reset is disabled. Financial state is controlled by the server ledger.');
  };

  // On-demand AI Task Generation in any portal
  const handleGenerateCustomTask = async (channel: string, prompt: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Authentication required');

    const res = await fetch('/api/ai/custom-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ channel, prompt }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'AI generation failed');
    return data;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        user={user}
        wallet={wallet}
        isAutoPilotActive={isAutoPilotActive}
        onToggleAutoPilot={() => setIsAutoPilotActive(!isAutoPilotActive)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenDeposit={() => {
          setWalletModalInitialTab('deposit');
          setIsWalletModalOpen(true);
        }}
        onOpenWithdraw={() => {
          setWalletModalInitialTab('withdraw');
          setIsWalletModalOpen(true);
        }}
        onOpenWalletModal={() => {
          setWalletModalInitialTab('history');
          setIsWalletModalOpen(true);
        }}
        activePortal={activePortal}
        setActivePortal={(portal) => {
          if (portal === 'wallet') {
            setWalletModalInitialTab('deposit');
            setIsWalletModalOpen(true);
          } else {
            setActivePortal(portal);
          }
        }}
      />

      <div className="sticky top-0 z-40 border-b border-rose-700 bg-rose-950 px-4 py-2.5 text-center text-xs sm:text-sm font-bold text-rose-100">
        THIS IS A SIMULATION. NO REAL MONEY IS BEING EARNED OR MOVED. Payment and payout providers are not configured.
      </div>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activePortal === 'dashboard' && (
          <CommandCenter
            wallet={wallet}
            logs={logs}
            isAutoPilotActive={isAutoPilotActive}
            onToggleAutoPilot={() => setIsAutoPilotActive(!isAutoPilotActive)}
            onRunSingleCycle={runAutoCycle}
            isProcessingCycle={isProcessingCycle}
            settings={settings}
            onUpdateSettings={setSettings}
            onOpenDeposit={() => {
              setWalletModalInitialTab('deposit');
              setIsWalletModalOpen(true);
            }}
            onOpenWithdraw={() => {
              setWalletModalInitialTab('withdraw');
              setIsWalletModalOpen(true);
            }}
            setActivePortal={setActivePortal}
          />
        )}

        {activePortal === 'youtube' && (
          <YouTubePortal onGenerateCustomTask={handleGenerateCustomTask} />
        )}

        {activePortal === 'social' && (
          <SocialPortal onGenerateCustomTask={handleGenerateCustomTask} />
        )}

        {activePortal === 'stock_market' && (
          <StockMarketPortal onGenerateCustomTask={handleGenerateCustomTask} />
        )}

        {activePortal === 'freelance' && (
          <FreelancePortal onGenerateCustomTask={handleGenerateCustomTask} />
        )}

        {activePortal === 'news' && (
          <NewsPortal onGenerateCustomTask={handleGenerateCustomTask} />
        )}

        {activePortal === 'studio' && (
          <RealAutoStudio onGenerateTask={handleGenerateCustomTask} />
        )}

        {activePortal === 'how-it-works' && <HowItWorks />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <button type="button" onClick={() => setActivePortal('how-it-works')} className="font-bold text-slate-300 hover:text-white">AutoEarnAI — How It Works</button>
            <span>•</span>
            <span>AI content & strategy workspace — financial activity is provider-gated</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Gemini-assisted content/analysis only • No real-money execution is enabled
          </div>
        </div>
      </footer>

      {/* Auth Modal (OTP Login) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Payment Gateway & Wallet Modal (Deposit / Withdrawal / Passbook) */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        wallet={wallet}
        onDepositSuccess={handleDepositSuccess}
        onWithdrawSuccess={handleWithdrawSuccess}
        onResetBalance={handleResetBalance}
        initialTab={walletModalInitialTab}
      />

    </div>
  );
}
