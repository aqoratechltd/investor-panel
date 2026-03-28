import { create } from 'zustand'
import type { SuperAdminMetrics, SellerMetrics, InvestorMetrics } from '@investor-panel/shared'

// ─── Demo data ───────────────────────────────────────────────────

const ADMIN_METRICS: SuperAdminMetrics = {
  totalSellers: 48,
  activeSellers: 41,
  pendingSellers: 7,
  totalInvestors: 1284,
  totalInvestments: 3920000,
  totalPlatformRevenue: 284000,
  totalActiveSubscriptions: 39,
  monthlyRevenueTrend: [
    { date: 'Oct', value: 38000 },
    { date: 'Nov', value: 45000 },
    { date: 'Dec', value: 52000 },
    { date: 'Jan', value: 48000 },
    { date: 'Feb', value: 61000 },
    { date: 'Mar', value: 71000 },
  ],
  sellerGrowth: [
    { date: 'Oct', value: 32 },
    { date: 'Nov', value: 36 },
    { date: 'Dec', value: 39 },
    { date: 'Jan', value: 41 },
    { date: 'Feb', value: 44 },
    { date: 'Mar', value: 48 },
  ],
  subscriptionBreakdown: [
    { name: 'Starter', value: 18, color: '#06b6d4' },
    { name: 'Growth', value: 14, color: '#8b5cf6' },
    { name: 'Enterprise', value: 7, color: '#10b981' },
  ],
}

const SELLER_METRICS: SellerMetrics = {
  totalInvestors: 84,
  activeInvestors: 71,
  totalInvested: 920000,
  totalProfit: 148000,
  totalLoss: 12000,
  netPnL: 136000,
  pendingWithdrawals: 9,
  pendingWithdrawalAmount: 32000,
  channelPerformance: [
    { channel: 'META_ADS', invested: 340000, currentValue: 398000, profitLoss: 58000, profitPercent: 17.06, investors: 31 },
    { channel: 'TIKTOK_ADS', invested: 210000, currentValue: 232000, profitLoss: 22000, profitPercent: 10.48, investors: 24 },
    { channel: 'GOOGLE_ADS', invested: 180000, currentValue: 196000, profitLoss: 16000, profitPercent: 8.89, investors: 18 },
    { channel: 'WHATSAPP', invested: 120000, currentValue: 127000, profitLoss: 7000, profitPercent: 5.83, investors: 11 },
    { channel: 'OTHER', invested: 70000, currentValue: 57000, profitLoss: -13000, profitPercent: -18.57, investors: 8 },
  ],
  investmentTrend: [
    { date: 'Oct', value: 680000 },
    { date: 'Nov', value: 720000 },
    { date: 'Dec', value: 760000 },
    { date: 'Jan', value: 810000 },
    { date: 'Feb', value: 870000 },
    { date: 'Mar', value: 920000 },
  ],
  topInvestors: [
    { id: '1', name: 'Ahmad Raza', totalInvested: 85000, totalProfit: 14200, roi: 16.7 },
    { id: '2', name: 'Sara Khan', totalInvested: 72000, totalProfit: 11500, roi: 15.97 },
    { id: '3', name: 'Bilal Ahmed', totalInvested: 60000, totalProfit: 8900, roi: 14.83 },
    { id: '4', name: 'Fatima Ali', totalInvested: 54000, totalProfit: 7200, roi: 13.33 },
    { id: '5', name: 'Usman Malik', totalInvested: 48000, totalProfit: 6100, roi: 12.71 },
  ],
}

const INVESTOR_METRICS: InvestorMetrics = {
  totalInvested: 25000,
  currentValue: 28420,
  totalProfit: 4120,
  totalLoss: 700,
  netROI: 3420,
  netROIPercent: 13.68,
  coinBalance: 842,
  dailyProfit: 420,
  weeklyProfit: 2100,
  monthlyProfit: 3420,
  portfolioAllocation: [
    { name: 'Meta Ads', value: 10000, color: '#06b6d4', percent: 40 },
    { name: 'TikTok Ads', value: 7500, color: '#8b5cf6', percent: 30 },
    { name: 'Google Ads', value: 5000, color: '#10b981', percent: 20 },
    { name: 'WhatsApp', value: 2500, color: '#f59e0b', percent: 10 },
  ],
  performanceTrend: [
    { date: 'Oct', value: 21000 },
    { date: 'Nov', value: 22400 },
    { date: 'Dec', value: 23100 },
    { date: 'Jan', value: 24800 },
    { date: 'Feb', value: 26500 },
    { date: 'Mar', value: 28420 },
  ],
  recentTransactions: [
    { id: 't1', tenantId: 'tenant_demo', investorId: 'investor_demo', type: 'PROFIT', amount: 420, currency: 'USD', description: 'Meta Ads daily profit', createdAt: new Date().toISOString() },
    { id: 't2', tenantId: 'tenant_demo', investorId: 'investor_demo', type: 'PROFIT', amount: 310, currency: 'USD', description: 'TikTok Ads profit', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 't3', tenantId: 'tenant_demo', investorId: 'investor_demo', type: 'WITHDRAWAL', amount: -1200, currency: 'USD', description: 'Bank withdrawal', createdAt: new Date(Date.now() - 172800000).toISOString() },
    { id: 't4', tenantId: 'tenant_demo', investorId: 'investor_demo', type: 'COIN_EARN', amount: 50, currency: 'COIN', description: 'Activity reward', createdAt: new Date(Date.now() - 259200000).toISOString() },
  ],
}

// ─────────────────────────────────────────────────────────────────

interface DashboardState {
  adminMetrics: SuperAdminMetrics | null
  sellerMetrics: SellerMetrics | null
  investorMetrics: InvestorMetrics | null
  isLoading: boolean
  lastFetched: number | null

  fetchAdminMetrics: () => Promise<void>
  fetchSellerMetrics: () => Promise<void>
  fetchInvestorMetrics: () => Promise<void>
  reset: () => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  adminMetrics: null,
  sellerMetrics: null,
  investorMetrics: null,
  isLoading: false,
  lastFetched: null,

  fetchAdminMetrics: async () => {
    set({ isLoading: true })
    await new Promise((r) => setTimeout(r, 300))
    set({ adminMetrics: ADMIN_METRICS, lastFetched: Date.now(), isLoading: false })
  },

  fetchSellerMetrics: async () => {
    set({ isLoading: true })
    await new Promise((r) => setTimeout(r, 300))
    set({ sellerMetrics: SELLER_METRICS, lastFetched: Date.now(), isLoading: false })
  },

  fetchInvestorMetrics: async () => {
    set({ isLoading: true })
    await new Promise((r) => setTimeout(r, 300))
    set({ investorMetrics: INVESTOR_METRICS, lastFetched: Date.now(), isLoading: false })
  },

  reset: () =>
    set({
      adminMetrics: null,
      sellerMetrics: null,
      investorMetrics: null,
      lastFetched: null,
    }),
}))
