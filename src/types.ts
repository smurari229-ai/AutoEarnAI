export type ChannelType = 'youtube' | 'social' | 'stock_market' | 'freelance' | 'news';

export interface UserProfile {
  id: string;
  phoneNumber: string;
  email?: string;
  name: string;
  avatarUrl?: string;
  createdAt: number;
  isVerified: boolean;
  kycStatus: 'verified' | 'pending' | 'unverified';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'ai_earning' | 'trade_profit' | 'freelance_payout' | 'ad_revenue' | 'affiliate_income';
  channel?: ChannelType;
  title: string;
  amount: number;
  currency: string;
  timestamp: number;
  status: 'completed' | 'processing' | 'pending' | 'failed';
  method?: string;
  referenceId: string;
  notes?: string;
}

export interface WalletState {
  totalBalance: number;
  todaysEarnings: number;
  totalWithdrawn: number;
  totalDeposited: number;
  lockedInTrades: number;
  currency: string;
  transactions: Transaction[];
}

export interface AgentLog {
  id: string;
  timestamp: number;
  channel: ChannelType | 'system';
  level: 'info' | 'success' | 'warning' | 'earning';
  message: string;
  profitEarned?: number;
  metadata?: Record<string, any>;
}

export interface YouTubeItem {
  id: string;
  title: string;
  niche: string;
  scriptSnippet: string;
  tags: string[];
  estimatedRevenue: number;
  views: number;
  cpm: number;
  status: 'monetized' | 'draft' | 'scheduled' | 'rendering';
  createdAt: number;
}

export interface SocialPost {
  id: string;
  platform: 'instagram' | 'facebook' | 'twitter';
  headline: string;
  caption: string;
  hashtags: string[];
  affiliateProduct?: string;
  clicks: number;
  conversions: number;
  revenue: number;
  status: 'posted' | 'scheduled' | 'viral';
  createdAt: number;
}

export interface StockTrade {
  id: string;
  symbol: string;
  assetType: 'stock' | 'crypto' | 'forex';
  type: 'BUY' | 'SELL';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  aiSignalRationale: string;
  status: 'open' | 'closed';
  timestamp: number;
}

export interface FreelanceJob {
  id: string;
  title: string;
  platform: 'Upwork' | 'Fiverr' | 'Freelancer' | 'Toptal';
  clientName: string;
  clientRating: number;
  budget: number;
  aiProposal: string;
  aiSolutionSnippet: string;
  status: 'bidding' | 'in_progress' | 'completed' | 'paid';
  completedAt?: number;
}

export interface NewsArticle {
  id: string;
  headline: string;
  category: 'Tech & AI' | 'Finance' | 'E-commerce' | 'Crypto' | 'Global Markets';
  summary: string;
  trafficCount: number;
  monetizedAdClicks: number;
  revenue: number;
  publishedAt: number;
}

export interface AutoPilotSettings {
  isEnabled: boolean;
  frequencySeconds: number;
  activeChannels: Record<ChannelType, boolean>;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  autoReinvest: boolean;
  dailyEarningTarget: number;
}
