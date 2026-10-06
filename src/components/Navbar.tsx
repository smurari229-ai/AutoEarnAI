import React from 'react';
import { 
  Bot, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Play, 
  Pause, 
  User, 
  LogOut, 
  ShieldCheck, 
  Sparkles,
  Zap
} from 'lucide-react';
import { UserProfile, WalletState } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  wallet: WalletState;
  isAutoPilotActive: boolean;
  onToggleAutoPilot: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenWalletModal: () => void;
  activePortal: string;
  setActivePortal: (portal: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  wallet,
  isAutoPilotActive,
  onToggleAutoPilot,
  onOpenAuth,
  onLogout,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenWalletModal,
  activePortal,
  setActivePortal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActivePortal('dashboard')} 
              className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
                <Bot className="w-6 h-6 text-slate-950 font-bold" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                    AutoEarn<span className="text-emerald-400">AI</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Auto-Pilot
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Autonomous Multi-Channel Revenue Engine
                </p>
              </div>
            </button>
          </div>

          {/* Center: Live Auto-Pilot Switch & Status */}
          <div className="hidden md:flex items-center gap-3 bg-slate-950/60 px-3 py-1.5 rounded-full border border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {isAutoPilotActive && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isAutoPilotActive ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
              </span>
              <span className="text-xs font-semibold text-slate-300">
                AI Engine: <span className={isAutoPilotActive ? 'text-emerald-400' : 'text-slate-400'}>{isAutoPilotActive ? 'LIVE EARNING' : 'PAUSED'}</span>
              </span>
            </div>

            <button
              onClick={onToggleAutoPilot}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm ${
                isAutoPilotActive
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              {isAutoPilotActive ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" /> Pause AI
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> Launch Auto-Pilot
                </>
              )}
            </button>
          </div>

          {/* Right: Wallet Balance, Quick Deposit/Withdraw & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Wallet Widget */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 sm:p-1.5 shadow-inner">
              <button
                onClick={onOpenWalletModal}
                className="flex items-center gap-2 px-2 sm:px-3 py-1 hover:bg-slate-800/50 rounded-lg transition-colors text-left"
                title="Open Wallet & Ledger"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Available Balance</div>
                  <div className="text-xs sm:text-sm font-bold text-white tracking-tight">
                    ₹{wallet.totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </button>

              <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block"></div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={onOpenDeposit}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors shadow-sm shadow-emerald-900/30"
                  title="Deposit Funds via UPI / Cards"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Deposit</span>
                </button>
                
                <button
                  onClick={onOpenWithdraw}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors border border-slate-700"
                  title="Withdraw to Bank / UPI"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Withdraw</span>
                </button>
              </div>
            </div>

            {/* Auth / Profile Area */}
            {user ? (
              <div className="flex items-center gap-2 pl-1">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-white flex items-center gap-1 justify-end">
                    {user.name}
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                  <span className="text-[10px] text-slate-400">{user.phoneNumber || user.email}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-800/50 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-md shadow-emerald-500/20 transition-all active:scale-95"
              >
                <User className="w-4 h-4" />
                <span>OTP Login</span>
              </button>
            )}

          </div>

        </div>
      </div>

      {/* Portal Navigation Bar */}
      <div className="bg-slate-950/70 border-t border-slate-800/60 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 py-1.5 min-w-max">
          {[
            { id: 'dashboard', label: '🚀 Command Center', desc: 'Overview & Auto-Pilot' },
            { id: 'studio', label: '✨ 1-Click Production Studio', desc: 'Autonomous Code & Scripts' },
            { id: 'youtube', label: '📺 YouTube Studio AI', desc: 'Faceless Monetization' },
            { id: 'social', label: '📱 Social Matrix', desc: 'IG / FB / X Affiliate' },
            { id: 'stock_market', label: '📈 Stock & Crypto Algo', desc: 'AI Signals & Trades' },
            { id: 'freelance', label: '💼 Freelance Hunter', desc: 'Upwork / Remote Bids' },
            { id: 'news', label: '📰 News Arbitrage', desc: 'SEO CPM Traffic' },
            { id: 'wallet', label: '💳 Wallet & Gateway', desc: 'Deposit / Withdraw' },
          ].map((tab) => {
            const isActive = activePortal === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActivePortal(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
