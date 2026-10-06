import React from 'react';
import { 
  Bot, 
  TrendingUp, 
  Zap, 
  DollarSign, 
  Play, 
  Pause, 
  Activity, 
  ArrowUpRight, 
  Sparkles, 
  CheckCircle2, 
  Terminal, 
  Youtube, 
  Share2, 
  BarChart2, 
  Briefcase, 
  Newspaper,
  Layers,
  Flame,
  ShieldAlert
} from 'lucide-react';
import { WalletState, AgentLog, AutoPilotSettings, ChannelType } from '../types';

interface CommandCenterProps {
  wallet: WalletState;
  logs: AgentLog[];
  isAutoPilotActive: boolean;
  onToggleAutoPilot: () => void;
  onRunSingleCycle: () => Promise<void>;
  isProcessingCycle: boolean;
  settings: AutoPilotSettings;
  onUpdateSettings: (newSettings: AutoPilotSettings) => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  setActivePortal: (portal: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  wallet,
  logs,
  isAutoPilotActive,
  onToggleAutoPilot,
  onRunSingleCycle,
  isProcessingCycle,
  settings,
  onUpdateSettings,
  onOpenDeposit,
  onOpenWithdraw,
  setActivePortal,
}) => {
  const channelBreakdowns = [
    { id: 'youtube', name: 'YouTube Studio AI', icon: Youtube, color: 'from-red-500 to-rose-600', share: '32%', estDaily: '₹1,850' },
    { id: 'stock_market', name: 'Stock & Crypto Algo', icon: BarChart2, color: 'from-emerald-500 to-teal-600', share: '28%', estDaily: '₹2,400' },
    { id: 'freelance', name: 'Freelance & Remote Hunter', icon: Briefcase, color: 'from-blue-500 to-indigo-600', share: '22%', estDaily: '₹1,600' },
    { id: 'social', name: 'Social Media Matrix', icon: Share2, color: 'from-purple-500 to-pink-600', share: '11%', estDaily: '₹950' },
    { id: 'news', name: 'News & Media Arbitrage', icon: Newspaper, color: 'from-amber-500 to-orange-600', share: '7%', estDaily: '₹620' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Status & Auto-Pilot Command */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-5 sm:p-7 shadow-xl">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 -mb-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Autonomous Multi-Channel AI Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Autonomous AI Revenue Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Continuous self-operating agent creating monetized YouTube videos, executing algorithmic stock trades, winning remote freelance gigs, curating news arbitrage, and running viral social campaigns.
            </p>
          </div>

          {/* Auto-Pilot Trigger Card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <div className="hidden lg:flex flex-col text-right mr-2">
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ZERO-DOWNTIME ACTIVE
              </span>
              <span className="text-[9px] text-slate-400">Auto-Fallback Enabled</span>
            </div>
            
            <button
              onClick={onToggleAutoPilot}
              className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                isAutoPilotActive
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
              }`}
            >
              {isAutoPilotActive ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Autonomous Engine</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Autonomous Engine</span>
                </>
              )}
            </button>

            <button
              onClick={onRunSingleCycle}
              disabled={isProcessingCycle}
              className="px-4 py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              title="Force execute 1 AI generation cycle immediately"
            >
              <Zap className={`w-3.5 h-3.5 text-cyan-400 ${isProcessingCycle ? 'animate-spin' : ''}`} />
              <span>1-Click Run Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Working Balance */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Active Working Capital</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            ₹{wallet.totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <button onClick={onOpenDeposit} className="text-emerald-400 hover:underline font-bold">
              + Deposit Funds
            </button>
            <span className="text-slate-600">•</span>
            <button onClick={onOpenWithdraw} className="text-amber-400 hover:underline font-bold">
              Withdraw
            </button>
          </div>
        </div>

        {/* 24h AI Revenue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Today's AI Earnings</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
            +₹{wallet.todaysEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <Flame className="w-3.5 h-3.5" />
            <span>Autonomous yield active</span>
          </div>
        </div>

        {/* AI Win & Execution Rate */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>AI Model & Engine</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-white font-mono flex items-center gap-1.5">
            <span>Gemini + AutoFallback</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Zero-Downtime Engine Active</span>
          </div>
        </div>

        {/* Active Portals */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Operating Portals</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            5 Channels
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>All systems online</span>
          </div>
        </div>

      </div>

      {/* Main Grid: Live AI Stream & Multi-Channel Workspaces */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Live Terminal & Autonomous Agent Stream */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Terminal Box */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
            <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300 ml-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>agent_runtime://live-stream-logger</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {isAutoPilotActive ? 'AGENT RUNNING (POLLING)' : 'IDLE'}
                </span>
              </div>
            </div>

            {/* Terminal Feed */}
            <div className="p-4 font-mono text-xs space-y-2.5 max-h-80 overflow-y-auto bg-slate-950/95 scrollbar-thin">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="text-slate-500 text-[10px] select-none">
                    [{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                  </span>
                  
                  {log.channel === 'stock_market' && <span className="text-emerald-400 font-bold">[STOCK_ALGO]</span>}
                  {log.channel === 'youtube' && <span className="text-rose-400 font-bold">[YOUTUBE_AI]</span>}
                  {log.channel === 'freelance' && <span className="text-blue-400 font-bold">[FREELANCE]</span>}
                  {log.channel === 'social' && <span className="text-purple-400 font-bold">[SOCIAL_NET]</span>}
                  {log.channel === 'news' && <span className="text-amber-400 font-bold">[NEWS_CURATE]</span>}
                  {log.channel === 'system' && <span className="text-cyan-400 font-bold">[SYSTEM_GATE]</span>}

                  <span className="text-slate-200 flex-1">{log.message}</span>
                  
                  {log.profitEarned && log.profitEarned > 0 ? (
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap">
                      +₹{log.profitEarned}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* 1-Click Autonomous Studio Highlight Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-purple-950/80 border border-emerald-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>1-Click Autonomous Production Studio</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">READY</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Ready Python scraper scripts, winning Upwork proposals, aur YouTube scripts bina kisi mehnat ke 1-click me ready karein aur download karein.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActivePortal('studio')}
              className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition-all shrink-0"
            >
              <span>Open Production Studio</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* 5 Portals Fast-Access Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Active Revenue Portals & Pipelines</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {channelBreakdowns.map((chan) => {
                const Icon = chan.icon;
                return (
                  <div
                    key={chan.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${chan.color} p-2 flex items-center justify-center text-white shadow-md`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {chan.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Est. Daily: <strong className="text-slate-200">{chan.estDaily}</strong> • Share: {chan.share}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActivePortal(chan.id)}
                      className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      title={`Open ${chan.name}`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Col: Auto-Pilot Engine Settings & Controls */}
        <div className="space-y-6">
          
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Auto-Pilot Parameters</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>

            {/* Execution Interval */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Autonomous Cycle Frequency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { sec: 10, label: 'Fast (10s)' },
                  { sec: 30, label: 'Medium (30s)' },
                  { sec: 60, label: 'Safe (60s)' },
                ].map((item) => (
                  <button
                    key={item.sec}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, frequencySeconds: item.sec })}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                      settings.frequencySeconds === item.sec
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Algorithm Trading Risk Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['conservative', 'moderate', 'aggressive'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, riskLevel: lvl })}
                    className={`py-2 rounded-lg text-xs font-bold capitalize border transition-all ${
                      settings.riskLevel === lvl
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Channels Toggle */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-slate-300">
                Enabled Auto-Earning Channels
              </label>
              {(
                [
                  { id: 'youtube', label: 'YouTube Content Pipeline' },
                  { id: 'stock_market', label: 'Stock & Crypto Scalper' },
                  { id: 'freelance', label: 'Upwork Project Solver' },
                  { id: 'social', label: 'Viral Affiliate Campaign' },
                  { id: 'news', label: 'News SEO Arbitrage' },
                ] as const
              ).map((ch) => {
                const isEnabled = settings.activeChannels[ch.id as ChannelType];
                return (
                  <label
                    key={ch.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
                  >
                    <span className="text-xs text-slate-300 font-medium">{ch.label}</span>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => {
                        onUpdateSettings({
                          ...settings,
                          activeChannels: {
                            ...settings.activeChannels,
                            [ch.id]: e.target.checked,
                          },
                        });
                      }}
                      className="w-4 h-4 accent-emerald-500 rounded"
                    />
                  </label>
                );
              })}
            </div>

            {/* Auto Re-invest Toggle */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Auto Compound Profits</div>
                <div className="text-[10px] text-slate-400">Reinvest earnings directly into stock capital</div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoReinvest}
                onChange={(e) => onUpdateSettings({ ...settings, autoReinvest: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
