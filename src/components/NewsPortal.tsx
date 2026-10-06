import React, { useState } from 'react';
import { 
  Newspaper, 
  Sparkles, 
  TrendingUp, 
  Globe, 
  Eye, 
  DollarSign, 
  CheckCircle2, 
  Copy, 
  RefreshCw, 
  Radio, 
  Flame 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { NewsArticle } from '../types';

interface NewsPortalProps {
  onGenerateCustomTask: (channel: string, prompt: string) => Promise<any>;
}

export const NewsPortal: React.FC<NewsPortalProps> = ({ onGenerateCustomTask }) => {
  const [newsCategory, setNewsCategory] = useState<string>('Tech & AI');
  const [headlineTopic, setHeadlineTopic] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedArticle, setGeneratedArticle] = useState<string | null>(null);
  const [earnedReward, setEarnedReward] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const [articles, setArticles] = useState<NewsArticle[]>([
    {
      id: 'NEWS-501',
      headline: 'India Accelerates Sovereign AI Infrastructure with Next-Gen Supercomputing Clusters',
      category: 'Tech & AI',
      summary: 'Government and private tech consortia announce massive capital allocation towards indigenous AI data centers, spurring semiconductor growth.',
      trafficCount: 14200,
      monetizedAdClicks: 210,
      revenue: 1240.00,
      publishedAt: Date.now() - 3600000 * 6
    },
    {
      id: 'NEWS-502',
      headline: 'Reserve Bank of India Expands Central Bank Digital Currency (e-Rupee) Interoperability',
      category: 'Finance',
      summary: 'New protocol enables instant cross-border settlement and retail offline QR code merchant integration across UPI rails.',
      trafficCount: 9800,
      monetizedAdClicks: 145,
      revenue: 890.00,
      publishedAt: Date.now() - 3600000 * 18
    },
    {
      id: 'NEWS-503',
      headline: 'Global Tech Giants Commit $50 Billion Towards Autonomous Software Agent Ecosystems',
      category: 'Global Markets',
      summary: 'Enterprise software shifts from static dashboards to autonomous self-executing agent swarms that operate 24/7.',
      trafficCount: 18500,
      monetizedAdClicks: 320,
      revenue: 1680.00,
      publishedAt: Date.now() - 3600000 * 30
    }
  ]);

  const handleGenerateNews = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptText = headlineTopic.trim() || `Write a breaking, authoritative news article in category "${newsCategory}". Include sensational headline, 3-paragraph SEO journalistic body, key takeaways, and Google AdSense CPM placement hooks.`;

    setIsGenerating(true);
    setGeneratedArticle(null);
    setEarnedReward(null);

    try {
      const res = await onGenerateCustomTask('news', promptText);
      if (res && res.output) {
        setGeneratedArticle(res.output);
        const reward = res.rewardEarned || 340;
        setEarnedReward(reward);

        const newArticle: NewsArticle = {
          id: 'NEWS-' + Date.now().toString().slice(-4),
          headline: headlineTopic || `Breaking: ${newsCategory} Trends 2026`,
          category: newsCategory as any,
          summary: res.output.slice(0, 120) + '...',
          trafficCount: 4200,
          monetizedAdClicks: 85,
          revenue: reward,
          publishedAt: Date.now()
        };
        setArticles(prev => [newArticle, ...prev]);

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

  const totalNewsRevenue = articles.reduce((acc, a) => acc + a.revenue, 0);
  const totalTraffic = articles.reduce((acc, a) => acc + a.trafficCount, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-900/30 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Newspaper className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">News & Media Arbitrage Desk</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                SEO & CPM Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous breaking news curator, SEO article publisher, programmatic display ads & CPM revenue collector.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Media CPM Revenue</div>
            <div className="text-base font-extrabold text-emerald-400 font-mono">
              ₹{totalNewsRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="h-7 w-px bg-slate-800"></div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Page Impressions</div>
            <div className="text-base font-extrabold text-cyan-400 font-mono">
              {totalTraffic.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Publisher Tool */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Generate & Syndicate Breaking Monetized News Article</span>
          </h3>
          <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            AdSense Payout +₹200 - ₹500
          </span>
        </div>

        <form onSubmit={handleGenerateNews} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                News Event / Breaking Topic
              </label>
              <input
                type="text"
                value={headlineTopic}
                onChange={(e) => setHeadlineTopic(e.target.value)}
                placeholder="e.g. RBI new guidelines on AI automated financial algorithms in 2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Media Category
              </label>
              <select
                value={newsCategory}
                onChange={(e) => setNewsCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Tech & AI">Tech & AI Breakthroughs</option>
                <option value="Finance">Banking & Indian FinTech</option>
                <option value="Global Markets">Global Stock Markets & Commodities</option>
                <option value="Crypto">Crypto & Digital Rupee (CBDC)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Trends:</span>
              {['India AI Missions', 'Nifty All-Time High', 'Remote Work 2026'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setHeadlineTopic(t)}
                  className="text-amber-400 hover:text-amber-300 underline"
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-600/20 transition-all flex items-center gap-2 active:scale-95 text-xs sm:text-sm"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Curating & Generating Article...</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4" />
                  <span>Publish Article & Collect CPM</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Generated Article Output */}
        {generatedArticle && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-amber-900/40 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Article Published to News Wire</span>
                {earnedReward && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    +₹{earnedReward} CPM Revenue Credited!
                  </span>
                )}
              </div>
              <button
                onClick={() => handleCopy(generatedArticle)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy Article'}</span>
              </button>
            </div>
            <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed">
              {generatedArticle}
            </pre>
          </div>
        )}
      </div>

      {/* Published News Feed */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <span>Live Syndicated News Wire & CPM Ledger</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {articles.map((art) => (
            <div key={art.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                    {art.category}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(art.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-2">
                  {art.headline}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {art.summary}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{art.trafficCount.toLocaleString()} reads</span>
                </div>
                <div className="font-mono font-bold text-emerald-400">
                  +₹{art.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
