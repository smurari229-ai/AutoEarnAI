import React, { useState } from 'react';
import { 
  Share2, 
  Instagram, 
  Facebook, 
  Twitter, 
  Sparkles, 
  TrendingUp, 
  MousePointerClick, 
  DollarSign, 
  Copy, 
  CheckCircle2, 
  RefreshCw,
  Send,
  Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SocialPost } from '../types';

interface SocialPortalProps {
  onGenerateCustomTask: (channel: string, prompt: string) => Promise<any>;
}

export const SocialPortal: React.FC<SocialPortalProps> = ({ onGenerateCustomTask }) => {
  const [platform, setPlatform] = useState<'instagram' | 'facebook' | 'twitter'>('instagram');
  const [productTopic, setProductTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<string | null>(null);
  const [earnedReward, setEarnedReward] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const [posts, setPosts] = useState<SocialPost[]>([
    {
      id: 'SOC-201',
      platform: 'instagram',
      headline: 'Stop Trading Your Time for Money. 3 AI Tools that Auto-Earn.',
      caption: 'Link in bio for the free automation toolkit that 10x-ed my freelance pipeline!',
      hashtags: ['#aiagents', '#passiveincome', '#reelsviral', '#techtools'],
      affiliateProduct: 'AI Auto-Workflow Pro (30% commission)',
      clicks: 840,
      conversions: 28,
      revenue: 2380.00,
      status: 'viral',
      createdAt: Date.now() - 3600000 * 12
    },
    {
      id: 'SOC-202',
      platform: 'twitter',
      headline: 'A masterclass thread on running algorithmic Python bots for trading Nifty & US Tech.',
      caption: '1/12 Most people lose money because they trade with emotion. Here is how our Gemini AI models remove emotion...',
      hashtags: ['#BuildInPublic', '#AlgoTrading', '#PythonBots', '#FinTech'],
      affiliateProduct: 'TradingAlgo Cloud Access',
      clicks: 1240,
      conversions: 19,
      revenue: 1615.00,
      status: 'viral',
      createdAt: Date.now() - 3600000 * 36
    },
    {
      id: 'SOC-203',
      platform: 'facebook',
      headline: 'How small business owners in India are using AI customer support bots to save ₹40,000/mo.',
      caption: 'Read the full breakdown and deploy in 10 minutes with our verified partner link below.',
      hashtags: ['#BusinessAutomation', '#SmallBusinessIndia', '#AITrends'],
      affiliateProduct: 'Enterprise AI Assistant SaaS',
      clicks: 450,
      conversions: 8,
      revenue: 680.00,
      status: 'posted',
      createdAt: Date.now() - 3600000 * 60
    }
  ]);

  const handleGenerateSocial = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptText = productTopic.trim() || `Create a high-engagement viral ${platform.toUpperCase()} post/reel hook promoting an affiliate AI productivity software. Include persuasive psychological hook, caption, call to action with affiliate link placeholder, and high-traffic hashtags.`;

    setIsGenerating(true);
    setGeneratedPost(null);
    setEarnedReward(null);

    try {
      const res = await onGenerateCustomTask('social', promptText);
      if (res && res.output) {
        setGeneratedPost(res.output);
        setEarnedReward(res.rewardEarned || 320);

        const newPost: SocialPost = {
          id: 'SOC-' + Date.now().toString().slice(-4),
          platform,
          headline: productTopic || `Viral ${platform.toUpperCase()} AI Campaign`,
          caption: res.output.slice(0, 100) + '...',
          hashtags: ['#ai', '#viral', '#techtrends', '#growth'],
          clicks: 120,
          conversions: 4,
          revenue: res.rewardEarned || 320,
          status: 'posted',
          createdAt: Date.now()
        };
        setPosts(prev => [newPost, ...prev]);

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

  const totalAffiliateRevenue = posts.reduce((acc, p) => acc + p.revenue, 0);
  const totalClicks = posts.reduce((acc, p) => acc + p.clicks, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 border border-purple-900/30 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Share2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Social Media Matrix & Affiliate Portal</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">
                Viral Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Automated Instagram Reels, Facebook Ads & Twitter (X) viral thread generation with affiliate conversions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Affiliate Commissions</div>
            <div className="text-base font-extrabold text-emerald-400 font-mono">
              ₹{totalAffiliateRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="h-7 w-px bg-slate-800"></div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Tracked Clicks</div>
            <div className="text-base font-extrabold text-cyan-400 font-mono">
              {totalClicks.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Generator Tool */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Generate High-Converting Viral Social Post & Affiliate Hook</span>
          </h3>
          <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Instant Commission +₹200 - ₹500
          </span>
        </div>

        <form onSubmit={handleGenerateSocial} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Platform
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                {[
                  { id: 'instagram', label: 'Instagram', icon: Instagram },
                  { id: 'twitter', label: 'X (Twitter)', icon: Twitter },
                  { id: 'facebook', label: 'Facebook', icon: Facebook },
                ].map((p) => {
                  const Icon = p.icon;
                  const isSel = platform === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlatform(p.id as any)}
                      className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                        isSel
                          ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Campaign / Product Topic
              </label>
              <input
                type="text"
                value={productTopic}
                onChange={(e) => setProductTopic(e.target.value)}
                placeholder="e.g. AI resume builder tool offering ₹500 affiliate bounty per sign up"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Quick:</span>
              {['AI Productivity Suite', 'Trading Bot Cloud', 'Python Remote Bootcamp'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setProductTopic(t)}
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2 active:scale-95 text-xs sm:text-sm"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gemini AI Crafting Viral Post...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Publish & Collect Payout</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Output Box */}
        {generatedPost && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-purple-900/40 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Social Campaign Ready</span>
                {earnedReward && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    +₹{earnedReward} credited to balance!
                  </span>
                )}
              </div>
              <button
                onClick={() => handleCopy(generatedPost)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy Post'}</span>
              </button>
            </div>
            <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed">
              {generatedPost}
            </pre>
          </div>
        )}
      </div>

      {/* Campaign Roster */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Flame className="w-4 h-4 text-purple-400" />
          <span>Active Viral Affiliate Campaigns</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {posts.map((post) => (
            <div key={post.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">
                    {post.platform}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    {post.conversions} Sales
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-2">
                  {post.headline}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {post.caption}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {post.hashtags.map(h => (
                    <span key={h} className="text-[10px] text-slate-500">{h}</span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                  <MousePointerClick className="w-3.5 h-3.5" />
                  <span>{post.clicks} clicks</span>
                </div>
                <div className="font-mono font-bold text-emerald-400">
                  +₹{post.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
