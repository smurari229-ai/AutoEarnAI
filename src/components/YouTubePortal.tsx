import React, { useState } from 'react';
import { 
  Youtube, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  TrendingUp, 
  Eye, 
  DollarSign, 
  FileText, 
  Tag, 
  Copy, 
  RefreshCw,
  Video,
  Clapperboard
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { YouTubeItem } from '../types';

interface YouTubePortalProps {
  onGenerateCustomTask: (channel: string, prompt: string) => Promise<any>;
}

export const YouTubePortal: React.FC<YouTubePortalProps> = ({ onGenerateCustomTask }) => {
  const [topicPrompt, setTopicPrompt] = useState('');
  const [niche, setNiche] = useState('AI & Wealth Tech');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [earnedReward, setEarnedReward] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const [videos, setVideos] = useState<YouTubeItem[]>([
    {
      id: 'YT-101',
      title: 'Top 7 Autonomous AI Agents That Make Money While You Sleep (2026)',
      niche: 'AI & Automation',
      scriptSnippet: 'Hook: What if your computer could find clients, write code, and deposit money into your account 24/7? In this video, we break down...',
      tags: ['ai money', 'autonomous agents', 'passive income 2026', 'gemini ai', 'automation tools'],
      estimatedRevenue: 3450.00,
      views: 48900,
      cpm: 5.40,
      status: 'monetized',
      createdAt: Date.now() - 3600000 * 24
    },
    {
      id: 'YT-102',
      title: 'How Faceless YouTube Channels Are Making ₹1,00,000/Month With Python Bots',
      niche: 'Coding & Fintech',
      scriptSnippet: 'Intro: You do not need a camera or a microphone. Here is the exact pipeline top creators use to scale faceless channels with AI...',
      tags: ['faceless youtube', 'python automation', 'ai video generator', 'finance cpm'],
      estimatedRevenue: 2890.50,
      views: 38200,
      cpm: 4.80,
      status: 'monetized',
      createdAt: Date.now() - 3600000 * 48
    },
    {
      id: 'YT-103',
      title: 'Stock Market AI Algorithmic Trading Explained For Beginners in Hindi',
      niche: 'Stock Market & Crypto',
      scriptSnippet: 'Hello Dosto, Aaj hum dekhenge kaise AI algorithms stock market me automatic buy/sell signals generate karte hain...',
      tags: ['stock market ai', 'algo trading hindi', 'nifty automated bots', 'intraday trading ai'],
      estimatedRevenue: 1940.00,
      views: 29500,
      cpm: 6.20,
      status: 'monetized',
      createdAt: Date.now() - 3600000 * 72
    }
  ]);

  const handleGenerateScript = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptText = topicPrompt.trim() || `High CPM YouTube video script in niche "${niche}" with viral hook, 5 talking points, thumbnail idea, and monetized affiliate sponsor plug.`;

    setIsGenerating(true);
    setGeneratedScript(null);
    setEarnedReward(null);

    try {
      const res = await onGenerateCustomTask('youtube', promptText);
      if (res && res.output) {
        setGeneratedScript(res.output);
        setEarnedReward(res.rewardEarned || 450);

        // Add to active library
        const newVideo: YouTubeItem = {
          id: 'YT-' + Date.now().toString().slice(-4),
          title: topicPrompt || `Automated High-CPM AI Guide: ${niche}`,
          niche: niche,
          scriptSnippet: res.output.slice(0, 140) + '...',
          tags: ['#ai', '#automation', '#passiveincome', '#youtubeautomation'],
          estimatedRevenue: res.rewardEarned || 450,
          views: 1200,
          cpm: 5.2,
          status: 'monetized',
          createdAt: Date.now()
        };
        setVideos(prev => [newVideo, ...prev]);

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalYoutubeRevenue = videos.reduce((acc, v) => acc + v.estimatedRevenue, 0);
  const totalViews = videos.reduce((acc, v) => acc + v.views, 0);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-950 border border-red-900/30 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
            <Youtube className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">YouTube Faceless Studio AI</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 uppercase">
                High CPM Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous video script generation, SEO tags, RPM monetization, and AdSense revenue tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Channel AdSense Est.</div>
            <div className="text-base font-extrabold text-emerald-400 font-mono">
              ₹{totalYoutubeRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="h-7 w-px bg-slate-800"></div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Monetized Views</div>
            <div className="text-base font-extrabold text-white font-mono">
              {totalViews.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Script Generator Box */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-400" />
            <span>Generate High-Converting YouTube Script & Monetization Strategy</span>
          </h3>
          <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Auto-Payout +₹250 - ₹750 per generation
          </span>
        </div>

        <form onSubmit={handleGenerateScript} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Video Topic / Keyword / Hook
              </label>
              <input
                type="text"
                value={topicPrompt}
                onChange={(e) => setTopicPrompt(e.target.value)}
                placeholder="e.g., 5 AI websites making $500/day in 2026 without showing face"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Monetization Niche
              </label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="AI & Wealth Tech">AI & Wealth Tech (CPM: $6-$12)</option>
                <option value="Personal Finance & Investing">Personal Finance & Investing (CPM: $8-$15)</option>
                <option value="Software & Coding Automation">Software & Coding Automation (CPM: $5-$10)</option>
                <option value="Crypto & Web3 Markets">Crypto & Web3 Markets (CPM: $7-$14)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Presets:</span>
              {['AI Tools 2026', 'Stock Trading Hindi', 'Python Web Scraping'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTopicPrompt(p)}
                  className="text-red-400 hover:text-red-300 underline"
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 active:scale-95 text-xs sm:text-sm"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gemini AI Drafting Script...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>Auto-Create Script & Claim Payout</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Generated Script Display */}
        {generatedScript && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-red-900/40 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Gemini 3.7 Script Generated</span>
                {earnedReward && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    +₹{earnedReward} credited to balance!
                  </span>
                )}
              </div>
              <button
                onClick={() => handleCopy(generatedScript)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy Script'}</span>
              </button>
            </div>
            <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed">
              {generatedScript}
            </pre>
          </div>
        )}
      </div>

      {/* Video Inventory & Monetization Roster */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-slate-400" />
          <span>Automated Video Pipeline & AdSense Ledger</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {videos.map((vid) => (
            <div key={vid.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    {vid.niche}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    CPM ${vid.cpm}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-2">
                  {vid.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                  "{vid.scriptSnippet}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{vid.views.toLocaleString()} views</span>
                </div>
                <div className="font-mono font-bold text-emerald-400">
                  +₹{vid.estimatedRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
