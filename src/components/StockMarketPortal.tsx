import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Activity, 
  DollarSign, 
  CheckCircle2, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  CandlestickChart
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StockTrade } from '../types';

interface StockMarketPortalProps {
  onGenerateCustomTask: (channel: string, prompt: string) => Promise<any>;
}

export const StockMarketPortal: React.FC<StockMarketPortalProps> = ({ onGenerateCustomTask }) => {
  const [selectedAsset, setSelectedAsset] = useState<string>('NIFTY 50');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [lastProfit, setLastProfit] = useState<number | null>(null);

  // Simulated live prices
  const [marketPrices, setMarketPrices] = useState<Record<string, { price: number; change: number; isUp: boolean }>>({
    'NIFTY 50': { price: 24850.40, change: 1.24, isUp: true },
    'BANK NIFTY': { price: 52400.10, change: 0.85, isUp: true },
    'RELIANCE': { price: 2980.20, change: -0.45, isUp: false },
    'TATA MOTORS': { price: 985.60, change: 2.10, isUp: true },
    'NVDA': { price: 128.50, change: 3.40, isUp: true },
    'BTC/USDT': { price: 68450.00, change: 1.95, isUp: true },
  });

  const [trades, setTrades] = useState<StockTrade[]>([
    {
      id: 'TRD-301',
      symbol: 'NIFTY 50 FUT',
      assetType: 'stock',
      type: 'BUY',
      entryPrice: 24780.00,
      currentPrice: 24850.40,
      quantity: 50,
      pnl: 3520.00,
      pnlPercent: 2.85,
      aiSignalRationale: 'RSI Bullish Crossover (32 -> 48) with 15-min Volume Breakout above VWAP.',
      status: 'open',
      timestamp: Date.now() - 3600000 * 2
    },
    {
      id: 'TRD-302',
      symbol: 'NVDA',
      assetType: 'stock',
      type: 'BUY',
      entryPrice: 124.20,
      currentPrice: 128.50,
      quantity: 20,
      pnl: 7138.00,
      pnlPercent: 3.46,
      aiSignalRationale: 'AI Data Center demand surge & Golden Cross on 4H chart.',
      status: 'open',
      timestamp: Date.now() - 3600000 * 5
    },
    {
      id: 'TRD-303',
      symbol: 'TATA MOTORS',
      assetType: 'stock',
      type: 'BUY',
      entryPrice: 965.00,
      currentPrice: 985.60,
      quantity: 100,
      pnl: 2060.00,
      pnlPercent: 2.13,
      aiSignalRationale: 'EV sales quarterly beat + Bollinger Bands lower bounce.',
      status: 'closed',
      timestamp: Date.now() - 3600000 * 24
    }
  ]);

  // Periodic simulated price flicker
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketPrices(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          const delta = (Math.random() - 0.48) * (next[k].price * 0.001);
          const newPrice = +(next[k].price + delta).toFixed(2);
          next[k] = {
            ...next[k],
            price: newPrice,
            isUp: delta >= 0
          };
        });
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleScanAndTrade = async () => {
    setIsScanning(true);
    setAiAnalysis(null);
    setLastProfit(null);

    const assetData = marketPrices[selectedAsset];
    const prompt = `Act as an elite quantitative algorithmic trading engine. Analyze asset ${selectedAsset} trading at ₹${assetData?.price || 24800}. Provide:
1. Signal: STRONG BUY or ACCUMULATE
2. Target Price & Stop Loss
3. Algorithmic Technical Rationale (EMA, Order Flow, Support/Resistance)
4. Estimated Trade Scalp Profit (₹500 - ₹2,000)`;

    try {
      const res = await onGenerateCustomTask('stock_market', prompt);
      if (res && res.output) {
        setAiAnalysis(res.output);
        const profit = res.rewardEarned || Math.floor(450 + Math.random() * 850);
        setLastProfit(profit);

        const newTrade: StockTrade = {
          id: 'TRD-' + Date.now().toString().slice(-4),
          symbol: selectedAsset,
          assetType: selectedAsset.includes('BTC') ? 'crypto' : 'stock',
          type: 'BUY',
          entryPrice: assetData?.price || 24800,
          currentPrice: +(assetData?.price * 1.015).toFixed(2),
          quantity: 25,
          pnl: profit,
          pnlPercent: 1.5,
          aiSignalRationale: res.output.slice(0, 110) + '...',
          status: 'open',
          timestamp: Date.now()
        };
        setTrades(prev => [newTrade, ...prev]);

        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const totalOpenPnl = trades.filter(t => t.status === 'open').reduce((acc, t) => acc + t.pnl, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-900/30 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <BarChart2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Stock & Crypto Algorithmic Trading Bot</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                High-Frequency Algo
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous quantitative analysis, automated order executions, real-time momentum scalping & risk stops.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Algorithmic P&L</div>
            <div className="text-base font-extrabold text-emerald-400 font-mono">
              +₹{totalOpenPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="h-7 w-px bg-slate-800"></div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Algo Win Rate</div>
            <div className="text-base font-extrabold text-cyan-400 font-mono">
              89.4%
            </div>
          </div>
        </div>
      </div>

      {/* Live Market Tickers Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {Object.entries(marketPrices).map(([symbol, data]: [string, { price: number; change: number; isUp: boolean }]) => {
          const isSelected = selectedAsset === symbol;
          return (
            <button
              key={symbol}
              onClick={() => setSelectedAsset(symbol)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] font-bold text-slate-300 truncate">{symbol}</div>
              <div className="text-xs sm:text-sm font-extrabold font-mono text-white mt-0.5">
                {symbol.includes('NVDA') ? '$' : symbol.includes('BTC') ? '$' : '₹'}
                {data.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className={`text-[10px] font-bold flex items-center gap-0.5 mt-0.5 ${
                data.isUp ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {data.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{data.change > 0 ? '+' : ''}{data.change}%</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* AI Scalping Execution Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Execute AI Quantitative Scalp on {selectedAsset}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Scans order books, 15-minute moving averages, and executes profitable trade signals automatically.
            </p>
          </div>

          <button
            onClick={handleScanAndTrade}
            disabled={isScanning}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 text-xs sm:text-sm"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Scanning Depth & Executing Trade...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>Auto-Execute {selectedAsset} Scalp Trade</span>
              </>
            )}
          </button>
        </div>

        {/* AI Trade Analysis Output */}
        {aiAnalysis && (
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Algorithmic Order Filled & Verified</span>
              </div>
              {lastProfit && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 font-mono">
                  +₹{lastProfit.toLocaleString('en-IN')} Trade Profit Credited!
                </span>
              )}
            </div>
            <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
              {aiAnalysis}
            </pre>
          </div>
        )}
      </div>

      {/* Trades Ledger Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          <span>Active & Historical Algorithmic Positions</span>
        </h3>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="p-3.5">Asset / Symbol</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Entry Price</th>
                  <th className="p-3.5">Current Price</th>
                  <th className="p-3.5">AI Technical Rationale</th>
                  <th className="p-3.5 text-right">P&L Profit</th>
                  <th className="p-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {trades.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-bold text-white">
                      {t.symbol}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                        {t.type}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      ₹{t.entryPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      ₹{t.currentPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-slate-400 max-w-xs truncate font-sans">
                      {t.aiSignalRationale}
                    </td>
                    <td className="p-3.5 text-right font-extrabold text-emerald-400">
                      +₹{t.pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'open' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
