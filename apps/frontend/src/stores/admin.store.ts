import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ── Types ────────────────────────────────────────────────────────────────────

export interface Seller {
  id: string
  companyName: string
  email: string
  phone: string
  plan: 'STARTER' | 'GROWTH' | 'ENTERPRISE'
  investors: number
  totalInvested: number
  isApproved: boolean
  isSuspended: boolean
  createdAt: string
  owner: string
}

export interface AdminWithdrawal {
  id: string
  investorName: string
  sellerName: string
  amount: number
  method: 'BANK' | 'EASYPAISA' | 'JAZZCASH' | 'STRIPE'
  status: 'PENDING' | 'PROCESSING' | 'APPROVED' | 'COMPLETED' | 'REJECTED'
  requestedAt: string
  processedAt?: string
  notes?: string
}

export interface Ad {
  id: string
  title: string
  type: 'BANNER' | 'MODAL' | 'NOTIFICATION'
  placement: 'INVESTOR_DASHBOARD' | 'SELLER_DASHBOARD' | 'ALL'
  targetRole: 'INVESTOR' | 'SELLER' | 'ALL'
  imageUrl: string
  link: string
  status: 'ACTIVE' | 'PAUSED' | 'SCHEDULED'
  impressions: number
  clicks: number
  startDate: string
  endDate: string
  createdAt: string
}

export interface ActivityLog {
  id: string
  type: 'AUTH' | 'WITHDRAWAL' | 'INVESTMENT' | 'ADMIN' | 'SECURITY' | 'USER' | 'SETTINGS' | 'DELETE'
  action: string
  actor: string
  role: string
  ip: string
  severity: 'info' | 'warning' | 'critical'
  timestamp: string
}

export interface Subscription {
  id: string
  sellerId: string
  sellerName: string
  sellerEmail: string
  plan: 'STARTER' | 'GROWTH' | 'ENTERPRISE'
  status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIALING'
  amount: number
  billingCycle: 'MONTHLY' | 'ANNUAL'
  nextBillingDate: string
  startedAt: string
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_SELLERS: Seller[] = [
  { id: 's1', companyName: 'Alpha Investments LLC', email: 'admin@alphainvest.io', phone: '+44 7700 900001', plan: 'GROWTH', investors: 87, totalInvested: 2400000, isApproved: true, isSuspended: false, createdAt: '2025-01-15T09:00:00Z', owner: 'James Carter' },
  { id: 's2', companyName: 'Meta Profit Co.', email: 'seller@metaprofit.com', phone: '+44 7700 900002', plan: 'STARTER', investors: 22, totalInvested: 480000, isApproved: true, isSuspended: false, createdAt: '2025-02-01T14:30:00Z', owner: 'Sarah Ahmed' },
  { id: 's3', companyName: 'Growth Partners', email: 'contact@growthpartners.io', phone: '+92 300 1234567', plan: 'ENTERPRISE', investors: 215, totalInvested: 8900000, isApproved: true, isSuspended: false, createdAt: '2024-11-20T11:00:00Z', owner: 'Omar Farooq' },
  { id: 's4', companyName: 'Digital Ads Pro', email: 'info@digitaladspro.com', phone: '+92 321 9876543', plan: 'GROWTH', investors: 45, totalInvested: 1200000, isApproved: true, isSuspended: true, createdAt: '2025-01-30T08:00:00Z', owner: 'Bilal Khan' },
  { id: 's5', companyName: 'NewSeller Corp', email: 'new@newseller.io', phone: '+1 555 000 0001', plan: 'STARTER', investors: 0, totalInvested: 0, isApproved: false, isSuspended: false, createdAt: '2025-03-10T09:00:00Z', owner: 'Alex Johnson' },
  { id: 's6', companyName: 'FinTech Hub', email: 'ops@fintechhub.io', phone: '+44 7700 900006', plan: 'GROWTH', investors: 0, totalInvested: 0, isApproved: false, isSuspended: false, createdAt: '2025-03-12T13:00:00Z', owner: 'Priya Sharma' },
]

const SEED_WITHDRAWALS: AdminWithdrawal[] = [
  { id: 'w1', investorName: 'Demo Investor', sellerName: 'Alpha Investments', amount: 15000, method: 'BANK', status: 'PENDING', requestedAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'w2', investorName: 'Rachel Torres', sellerName: 'Growth Partners', amount: 8500, method: 'STRIPE', status: 'PENDING', requestedAt: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'w3', investorName: 'Umar Khan', sellerName: 'Meta Profit Co.', amount: 3200, method: 'EASYPAISA', status: 'PROCESSING', requestedAt: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: 'w4', investorName: 'Fatima Malik', sellerName: 'Alpha Investments', amount: 22000, method: 'BANK', status: 'COMPLETED', requestedAt: new Date(Date.now() - 3 * 86400000).toISOString(), processedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'w5', investorName: 'John Smith', sellerName: 'Growth Partners', amount: 5000, method: 'JAZZCASH', status: 'APPROVED', requestedAt: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: 'w6', investorName: 'Aisha Raza', sellerName: 'FinTech Hub', amount: 900, method: 'EASYPAISA', status: 'REJECTED', requestedAt: new Date(Date.now() - 4 * 86400000).toISOString(), notes: 'Account verification failed' },
  { id: 'w7', investorName: 'Michael Lee', sellerName: 'Digital Ads Pro', amount: 11500, method: 'STRIPE', status: 'COMPLETED', requestedAt: new Date(Date.now() - 5 * 86400000).toISOString(), processedAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: 'w8', investorName: 'Sara Qureshi', sellerName: 'Meta Profit Co.', amount: 6800, method: 'BANK', status: 'PENDING', requestedAt: new Date(Date.now() - 1 * 3600000).toISOString() },
]

const SEED_ADS: Ad[] = [
  { id: 'ad1', title: 'Boost Your Portfolio Today', type: 'BANNER', placement: 'INVESTOR_DASHBOARD', targetRole: 'INVESTOR', imageUrl: '', link: '/marketplace', status: 'ACTIVE', impressions: 24820, clicks: 1341, startDate: '2025-03-01', endDate: '2025-04-01', createdAt: '2025-02-28T10:00:00Z' },
  { id: 'ad2', title: 'Premium Plan Upgrade', type: 'MODAL', placement: 'SELLER_DASHBOARD', targetRole: 'SELLER', imageUrl: '', link: '/seller/settings', status: 'ACTIVE', impressions: 8432, clicks: 562, startDate: '2025-03-05', endDate: '2025-04-05', createdAt: '2025-03-04T09:00:00Z' },
  { id: 'ad3', title: 'Earn 500 Coins This Week', type: 'NOTIFICATION', placement: 'ALL', targetRole: 'ALL', imageUrl: '', link: '/investor/coins', status: 'ACTIVE', impressions: 41200, clicks: 3280, startDate: '2025-03-10', endDate: '2025-03-20', createdAt: '2025-03-09T08:00:00Z' },
  { id: 'ad4', title: 'New Market Assets Available', type: 'BANNER', placement: 'INVESTOR_DASHBOARD', targetRole: 'INVESTOR', imageUrl: '', link: '/marketplace', status: 'PAUSED', impressions: 5100, clicks: 280, startDate: '2025-02-15', endDate: '2025-03-15', createdAt: '2025-02-14T11:00:00Z' },
]

const SEED_LOGS: ActivityLog[] = [
  { id: 'l1', type: 'AUTH', action: 'User login successful', actor: 'investor@demo.io', role: 'INVESTOR', ip: '192.168.1.24', severity: 'info', timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: 'l2', type: 'WITHDRAWAL', action: 'Withdrawal request of $15,000 submitted', actor: 'investor@demo.io', role: 'INVESTOR', ip: '192.168.1.24', severity: 'warning', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'l3', type: 'ADMIN', action: 'Seller "NewSeller Corp" approved', actor: 'admin@investorpanel.io', role: 'SUPER_ADMIN', ip: '10.0.0.1', severity: 'info', timestamp: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: 'l4', type: 'SECURITY', action: 'Failed login attempt (3rd) — account locked', actor: 'unknown@hacker.io', role: 'UNKNOWN', ip: '45.33.32.156', severity: 'critical', timestamp: new Date(Date.now() - 6 * 3600000).toISOString() },
  { id: 'l5', type: 'INVESTMENT', action: 'Portfolio allocation saved — $120,000 distributed', actor: 'seller@demo.io', role: 'SELLER', ip: '10.0.0.5', severity: 'info', timestamp: new Date(Date.now() - 8 * 3600000).toISOString() },
  { id: 'l6', type: 'AUTH', action: 'User logout', actor: 'seller@demo.io', role: 'SELLER', ip: '10.0.0.5', severity: 'info', timestamp: new Date(Date.now() - 9 * 3600000).toISOString() },
  { id: 'l7', type: 'DELETE', action: 'Seller "Suspended Corp" account deleted', actor: 'admin@investorpanel.io', role: 'SUPER_ADMIN', ip: '10.0.0.1', severity: 'warning', timestamp: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: 'l8', type: 'SETTINGS', action: 'Platform fee updated to 2.5%', actor: 'admin@investorpanel.io', role: 'SUPER_ADMIN', ip: '10.0.0.1', severity: 'info', timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'l9', type: 'USER', action: 'New investor registered', actor: 'newinvestor@test.io', role: 'INVESTOR', ip: '203.0.113.42', severity: 'info', timestamp: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'l10', type: 'WITHDRAWAL', action: 'Withdrawal approved — $22,000 to bank account', actor: 'admin@investorpanel.io', role: 'SUPER_ADMIN', ip: '10.0.0.1', severity: 'info', timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
]

const SEED_SUBSCRIPTIONS: Subscription[] = [
  { id: 'sub1', sellerId: 's1', sellerName: 'Alpha Investments LLC', sellerEmail: 'admin@alphainvest.io', plan: 'GROWTH', status: 'ACTIVE', amount: 149, billingCycle: 'MONTHLY', nextBillingDate: '2025-04-15', startedAt: '2025-01-15' },
  { id: 'sub2', sellerId: 's2', sellerName: 'Meta Profit Co.', sellerEmail: 'seller@metaprofit.com', plan: 'STARTER', status: 'ACTIVE', amount: 49, billingCycle: 'MONTHLY', nextBillingDate: '2025-04-01', startedAt: '2025-02-01' },
  { id: 'sub3', sellerId: 's3', sellerName: 'Growth Partners', sellerEmail: 'contact@growthpartners.io', plan: 'ENTERPRISE', status: 'ACTIVE', amount: 3588, billingCycle: 'ANNUAL', nextBillingDate: '2025-11-20', startedAt: '2024-11-20' },
  { id: 'sub4', sellerId: 's4', sellerName: 'Digital Ads Pro', sellerEmail: 'info@digitaladspro.com', plan: 'GROWTH', status: 'PAST_DUE', amount: 149, billingCycle: 'MONTHLY', nextBillingDate: '2025-02-28', startedAt: '2025-01-30' },
  { id: 'sub5', sellerId: 's5', sellerName: 'NewSeller Corp', sellerEmail: 'new@newseller.io', plan: 'STARTER', status: 'TRIALING', amount: 0, billingCycle: 'MONTHLY', nextBillingDate: '2025-03-24', startedAt: '2025-03-10' },
]

// ── Store ─────────────────────────────────────────────────────────────────────

interface AdminState {
  sellers: Seller[]
  withdrawals: AdminWithdrawal[]
  ads: Ad[]
  logs: ActivityLog[]
  subscriptions: Subscription[]

  // Sellers
  approveSeller: (id: string) => void
  suspendSeller: (id: string) => void
  unsuspendSeller: (id: string) => void
  deleteSeller: (id: string) => void
  addSeller: (seller: Omit<Seller, 'id' | 'createdAt' | 'investors' | 'totalInvested'>) => void

  // Withdrawals
  approveWithdrawal: (id: string) => void
  rejectWithdrawal: (id: string, notes?: string) => void
  markWithdrawalProcessing: (id: string) => void
  markWithdrawalCompleted: (id: string) => void

  // Ads
  createAd: (ad: Omit<Ad, 'id' | 'impressions' | 'clicks' | 'createdAt'>) => void
  toggleAdStatus: (id: string) => void
  deleteAd: (id: string) => void
  incrementAdImpression: (id: string) => void
  incrementAdClick: (id: string) => void

  // Logs
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void

  // Subscriptions
  cancelSubscription: (id: string) => void
  updatePlan: (id: string, plan: Subscription['plan']) => void
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      sellers: SEED_SELLERS,
      withdrawals: SEED_WITHDRAWALS,
      ads: SEED_ADS,
      logs: SEED_LOGS,
      subscriptions: SEED_SUBSCRIPTIONS,

      // ── Sellers ──────────────────────────────────────────────────────────
      approveSeller: (id) => {
        set((s) => ({
          sellers: s.sellers.map((sel) => sel.id === id ? { ...sel, isApproved: true, isSuspended: false } : sel),
        }))
        get().addLog({ type: 'ADMIN', action: `Seller approved`, actor: 'admin@investorpanel.io', role: 'SUPER_ADMIN', ip: '10.0.0.1', severity: 'info' })
      },
      suspendSeller: (id) => {
        set((s) => ({ sellers: s.sellers.map((sel) => sel.id === id ? { ...sel, isSuspended: true } : sel) }))
        get().addLog({ type: 'ADMIN', action: `Seller suspended`, actor: 'admin@investorpanel.io', role: 'SUPER_ADMIN', ip: '10.0.0.1', severity: 'warning' })
      },
      unsuspendSeller: (id) => {
        set((s) => ({ sellers: s.sellers.map((sel) => sel.id === id ? { ...sel, isSuspended: false } : sel) }))
      },
      deleteSeller: (id) => {
        set((s) => ({ sellers: s.sellers.filter((sel) => sel.id !== id) }))
        get().addLog({ type: 'DELETE', action: `Seller account deleted`, actor: 'admin@investorpanel.io', role: 'SUPER_ADMIN', ip: '10.0.0.1', severity: 'warning' })
      },
      addSeller: (seller) => {
        const newSeller: Seller = {
          ...seller,
          id: `s_${Date.now()}`,
          investors: 0,
          totalInvested: 0,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ sellers: [newSeller, ...s.sellers] }))
      },

      // ── Withdrawals ───────────────────────────────────────────────────────
      approveWithdrawal: (id) => {
        set((s) => ({
          withdrawals: s.withdrawals.map((w) => w.id === id ? { ...w, status: 'APPROVED' as const } : w),
        }))
        get().addLog({ type: 'WITHDRAWAL', action: `Withdrawal approved`, actor: 'admin@investorpanel.io', role: 'SUPER_ADMIN', ip: '10.0.0.1', severity: 'info' })
      },
      rejectWithdrawal: (id, notes) => {
        set((s) => ({
          withdrawals: s.withdrawals.map((w) => w.id === id ? { ...w, status: 'REJECTED' as const, notes } : w),
        }))
        get().addLog({ type: 'WITHDRAWAL', action: `Withdrawal rejected${notes ? ': ' + notes : ''}`, actor: 'admin@investorpanel.io', role: 'SUPER_ADMIN', ip: '10.0.0.1', severity: 'warning' })
      },
      markWithdrawalProcessing: (id) => {
        set((s) => ({ withdrawals: s.withdrawals.map((w) => w.id === id ? { ...w, status: 'PROCESSING' as const } : w) }))
      },
      markWithdrawalCompleted: (id) => {
        set((s) => ({
          withdrawals: s.withdrawals.map((w) => w.id === id ? { ...w, status: 'COMPLETED' as const, processedAt: new Date().toISOString() } : w),
        }))
      },

      // ── Ads ───────────────────────────────────────────────────────────────
      createAd: (ad) => {
        const newAd: Ad = { ...ad, id: `ad_${Date.now()}`, impressions: 0, clicks: 0, createdAt: new Date().toISOString() }
        set((s) => ({ ads: [newAd, ...s.ads] }))
        get().addLog({ type: 'SETTINGS', action: `Ad "${ad.title}" created`, actor: 'admin@investorpanel.io', role: 'SUPER_ADMIN', ip: '10.0.0.1', severity: 'info' })
      },
      toggleAdStatus: (id) => {
        set((s) => ({
          ads: s.ads.map((a) => a.id === id ? { ...a, status: a.status === 'ACTIVE' ? 'PAUSED' as const : 'ACTIVE' as const } : a),
        }))
      },
      deleteAd: (id) => {
        set((s) => ({ ads: s.ads.filter((a) => a.id !== id) }))
      },
      incrementAdImpression: (id) => {
        set((s) => ({ ads: s.ads.map((a) => a.id === id ? { ...a, impressions: a.impressions + 1 } : a) }))
      },
      incrementAdClick: (id) => {
        set((s) => ({ ads: s.ads.map((a) => a.id === id ? { ...a, clicks: a.clicks + 1 } : a) }))
      },

      // ── Logs ──────────────────────────────────────────────────────────────
      addLog: (log) => {
        const newLog: ActivityLog = { ...log, id: `log_${Date.now()}`, timestamp: new Date().toISOString() }
        set((s) => ({ logs: [newLog, ...s.logs].slice(0, 500) }))
      },

      // ── Subscriptions ─────────────────────────────────────────────────────
      cancelSubscription: (id) => {
        set((s) => ({ subscriptions: s.subscriptions.map((sub) => sub.id === id ? { ...sub, status: 'CANCELLED' as const } : sub) }))
      },
      updatePlan: (id, plan) => {
        const prices: Record<string, number> = { STARTER: 49, GROWTH: 149, ENTERPRISE: 399 }
        set((s) => ({ subscriptions: s.subscriptions.map((sub) => sub.id === id ? { ...sub, plan, amount: prices[plan] } : sub) }))
      },
    }),
    {
      name: 'investor-panel-admin',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
