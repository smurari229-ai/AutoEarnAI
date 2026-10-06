import React, { useState } from 'react';
import { 
  Briefcase, 
  Sparkles, 
  CheckCircle2, 
  DollarSign, 
  Star, 
  Send, 
  Code, 
  Copy, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FreelanceJob } from '../types';

interface FreelancePortalProps {
  onGenerateCustomTask: (channel: string, prompt: string) => Promise<any>;
}

export const FreelancePortal: React.FC<FreelancePortalProps> = ({ onGenerateCustomTask }) => {
  const [selectedJob, setSelectedJob] = useState<FreelanceJob | null>(null);
  const [customSkillPrompt, setCustomSkillPrompt] = useState<string>('');
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [solvedOutput, setSolvedOutput] = useState<string | null>(null);
  const [earnedReward, setEarnedReward] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const [jobs, setJobs] = useState<FreelanceJob[]>([
    {
      id: 'JOB-401',
      title: 'Build automated Python web scraper with proxy rotation & structured JSON export',
      platform: 'Upwork',
      clientName: 'Nexus Global Media (USA)',
      clientRating: 4.9,
      budget: 1850.00,
      aiProposal: 'Hi there, I have built dozens of resilient Playwright/BeautifulSoup scrapers with rate limiting...',
      aiSolutionSnippet: 'import httpx\nimport asyncio\n# Async proxy scraper with automatic retry and exponential backoff...',
      status: 'completed',
      completedAt: Date.now() - 3600000 * 8
    },
    {
      id: 'JOB-402',
      title: 'Next.js 15 Tailwind CSS responsive SaaS dashboard with authentication & dark mode',
      platform: 'Freelancer',
      clientName: 'Apex Financial Technologies (UK)',
      clientRating: 5.0,
      budget: 3400.00,
      aiProposal: 'Expert full-stack developer ready to deliver pixel-perfect responsive dashboard using Tailwind and Lucide...',
      aiSolutionSnippet: '// Modular Next.js app layout with reactive SSR context and theme switching...',
      status: 'in_progress',
      completedAt: Date.now() - 3600000 * 20
    },
    {
      id: 'JOB-403',
      title: 'Write 10 SEO-optimized blog posts on Artificial Intelligence in Healthcare',
      platform: 'Fiverr',
      clientName: 'BioHealth Ventures (Canada)',
      clientRating: 4.8,
      budget: 1200.00,
      aiProposal: 'I specialize in high-authority medical AI research writing with verified citations...',
      aiSolutionSnippet: '# Comprehensive guide to AI diagnostics and robotic surgery integration in 2026...',
      status: 'completed',
      completedAt: Date.now() - 3600000 * 40
    }
  ]);

  const handleSolveJob = async (job?: FreelanceJob) => {
    const target = job || selectedJob || jobs[0];
    setIsSolving(true);
    setSolvedOutput(null);
    setEarnedReward(null);

    const promptText = `Act as an elite full-stack developer & freelance expert. 
Task: "${target.title}" for client ${target.clientName} (Budget: ₹${target.budget}).
1. Write a winning, personalized, high-converting proposal.
2. Provide the complete code or deliverable solution snippet ready to submit.
3. Summary of delivery instructions.`;

    try {
      const res = await onGenerateCustomTask('freelance', promptText);
      if (res && res.output) {
        setSolvedOutput(res.output);
        const reward = res.rewardEarned || target.budget;
        setEarnedReward(reward);

        // Update target job status
        setJobs(prev => prev.map(j => j.id === target.id ? { ...j, status: 'completed', completedAt: Date.now() } : j));

        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSolving(false);
    }
  };

  const handleCreateCustomJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSkillPrompt.trim()) return;

    setIsSolving(true);
    setSolvedOutput(null);

    const promptText = `Create freelance client proposal and ready deliverable for: "${customSkillPrompt}". Include full working code/deliverable.`;

    try {
      const res = await onGenerateCustomTask('freelance', promptText);
      if (res && res.output) {
        setSolvedOutput(res.output);
        const reward = res.rewardEarned || 850;
        setEarnedReward(reward);

        const newJob: FreelanceJob = {
          id: 'JOB-' + Date.now().toString().slice(-4),
          title: customSkillPrompt,
          platform: 'Upwork',
          clientName: 'Enterprise Client',
          clientRating: 4.9,
          budget: reward,
          aiProposal: res.output.slice(0, 100) + '...',
          aiSolutionSnippet: res.output.slice(0, 150) + '...',
          status: 'completed',
          completedAt: Date.now()
        };
        setJobs(prev => [newJob, ...prev]);

        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSolving(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalFreelanceEarnings = jobs.filter(j => j.status === 'completed').reduce((acc, j) => acc + j.budget, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-950 border border-blue-900/30 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Briefcase className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Freelance & Remote Job Auto-Bidder</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                Upwork & Remote Bot
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous job crawler, proposal generator, instant AI solution solver, and milestone escrow collector.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Completed Deliverables</div>
            <div className="text-base font-extrabold text-emerald-400 font-mono">
              ₹{totalFreelanceEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="h-7 w-px bg-slate-800"></div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Client Satisfaction</div>
            <div className="text-base font-extrabold text-cyan-400 font-mono flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>4.9 / 5.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Solve Custom Task Bar */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Hunt & Auto-Solve Any Custom Freelance Gig</span>
          </h3>
          <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Auto Escrow Release +₹500 - ₹2,000
          </span>
        </div>

        <form onSubmit={handleCreateCustomJob} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={customSkillPrompt}
            onChange={(e) => setCustomSkillPrompt(e.target.value)}
            placeholder="e.g. Build an Express.js payment gateway webhook handler in TypeScript"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={isSolving || !customSkillPrompt.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 text-xs sm:text-sm whitespace-nowrap"
          >
            {isSolving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI Solving Deliverable...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>Solve & Claim Payout</span>
              </>
            )}
          </button>
        </form>

        {/* Solved Output Display */}
        {solvedOutput && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-blue-900/40 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Freelance Proposal & Deliverable Ready</span>
                {earnedReward && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    +₹{earnedReward} Milestone Paid!
                  </span>
                )}
              </div>
              <button
                onClick={() => handleCopy(solvedOutput)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy Solution'}</span>
              </button>
            </div>
            <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed">
              {solvedOutput}
            </pre>
          </div>
        )}
      </div>

      {/* Live Remote Jobs Feed */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-400" />
          <span>Live Remote Gigs & AI Automated Bids</span>
        </h3>

        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {job.platform}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <span>{job.clientName}</span>
                    <span>•</span>
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>{job.clientRating}</span>
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  {job.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-1">
                  AI Solution: <span className="font-mono text-slate-300">{job.aiSolutionSnippet}</span>
                </p>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Budget Milestone</div>
                  <div className="text-sm font-extrabold font-mono text-emerald-400">
                    ₹{job.budget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <button
                  onClick={() => handleSolveJob(job)}
                  disabled={isSolving}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    job.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                  }`}
                >
                  {job.status === 'completed' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed & Paid</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Auto-Solve Gig</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
