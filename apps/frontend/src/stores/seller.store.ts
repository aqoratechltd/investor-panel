import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SellerCoin {
  id: string
  name: string
  symbol: string
  icon: string
  returnRate: number
  isPositive: boolean
  totalSupply: number
  currentPrice: number
  description: string
  isActive: boolean
  createdAt: string
}

export interface SellerInvestor {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  totalInvested: number
  totalProfit: number
  roi: number
  coinBalance: number
  status: 'ACTIVE' | 'PAUSED' | 'INACTIVE'
  joinedAt: string
  lastActivity: string
}

export interface SellerWithdrawal {
  id: string
  investorId: string
  investorName: string
  amount: number
  method: 'BANK' | 'EASYPAISA' | 'JAZZCASH' | 'STRIPE'
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  accountDetails: string
  requestedAt: string
  processedAt?: string
  notes?: string
}

export interface Task {
  id: string
  title: string
  description: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  assignee: string
  dueDate: string
  tags: string[]
  createdAt: string
}

export interface Meeting {
  id: string
  title: string
  type: 'VIDEO' | 'PHONE' | 'IN_PERSON'
  attendees: string[]
  date: string
  duration: number
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED'
  notes?: string
  link?: string
  createdAt: string
}

export interface TeamMessage {
  id: string
  contactId: string
  senderId: string
  senderName: string
  senderRole: 'SELLER' | 'INVESTOR'
  content: string
  timestamp: string
  read: boolean
}

export interface TeamContact {
  id: string
  name: string
  role: string
  status: 'ONLINE' | 'AWAY' | 'OFFLINE'
  unread: number
  lastMessage: string
  lastSeen: string
  avatar?: string
}

export interface SellerInvestment {
  id: string
  channel: string
  channelColor: string
  totalInvested: number
  currentValue: number
  pnl: number
  pnlPercent: number
  investorCount: number
  trend: Array<{ date: string; value: number }>
}

// ── Seed data ──────────────────────────────────────────────────────────────────

function genTrend(base: number, days = 14): Array<{ date: string; value: number }> {
  const arr: Array<{ date: string; value: number }> = []
  let v = base * 0.9
  for (let i = days; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    v = v * (1 + (Math.random() - 0.44) * 0.04)
    arr.push({ date: d.toISOString().split('T')[0], value: Math.round(v) })
  }
  return arr
}

const SEED_COINS: SellerCoin[] = [
  { id: 'c1', name: 'MetaCoin', symbol: 'META', icon: '🎯', returnRate: 5.2, isPositive: true, totalSupply: 420000, currentPrice: 1.24, description: 'Represents Meta Ads channel returns', isActive: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'c2', name: 'TikTokCoin', symbol: 'TKTK', icon: '🎵', returnRate: 3.6, isPositive: true, totalSupply: 210000, currentPrice: 0.98, description: 'TikTok Ads performance token', isActive: true, createdAt: '2025-01-15T00:00:00Z' },
  { id: 'c3', name: 'GrowthCoin', symbol: 'GRWTH', icon: '📈', returnRate: 8.1, isPositive: true, totalSupply: 180000, currentPrice: 2.15, description: 'Compound growth incentive', isActive: true, createdAt: '2025-02-01T00:00:00Z' },
  { id: 'c4', name: 'ExtraCoin', symbol: 'XTRA', icon: '⚡', returnRate: 2.4, isPositive: false, totalSupply: 32000, currentPrice: 0.45, description: 'Experimental channel token', isActive: false, createdAt: '2025-02-15T00:00:00Z' },
]

const SEED_INVESTORS: SellerInvestor[] = [
  { id: 'i1', firstName: 'Demo', lastName: 'Investor', email: 'investor@demo.io', phone: '+44 7700 900001', totalInvested: 248500, totalProfit: 32840, roi: 13.22, coinBalance: 8420, status: 'ACTIVE', joinedAt: '2025-01-10T09:00:00Z', lastActivity: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'i2', firstName: 'Rachel', lastName: 'Torres', email: 'rachel@torres.io', phone: '+44 7700 900002', totalInvested: 120000, totalProfit: 32400, roi: 27.0, coinBalance: 3240, status: 'ACTIVE', joinedAt: '2025-01-20T10:00:00Z', lastActivity: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'i3', firstName: 'Umar', lastName: 'Khan', email: 'umar@khan.pk', phone: '+92 300 1234567', totalInvested: 85000, totalProfit: 11900, roi: 14.0, coinBalance: 1850, status: 'ACTIVE', joinedAt: '2025-02-01T08:00:00Z', lastActivity: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: 'i4', firstName: 'Fatima', lastName: 'Malik', email: 'fatima@malik.io', phone: '+92 321 9876543', totalInvested: 200000, totalProfit: -12000, roi: -6.0, coinBalance: 5100, status: 'PAUSED', joinedAt: '2024-11-15T11:00:00Z', lastActivity: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: 'i5', firstName: 'John', lastName: 'Smith', email: 'john@smith.io', phone: '+1 555 000 0001', totalInvested: 50000, totalProfit: 8500, roi: 17.0, coinBalance: 920, status: 'ACTIVE', joinedAt: '2025-02-10T14:00:00Z', lastActivity: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'i6', firstName: 'Aisha', lastName: 'Raza', email: 'aisha@raza.pk', phone: '+92 333 5555555', totalInvested: 30000, totalProfit: 3600, roi: 12.0, coinBalance: 460, status: 'ACTIVE', joinedAt: '2025-03-01T09:00:00Z', lastActivity: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: 'i7', firstName: 'Michael', lastName: 'Lee', email: 'michael@lee.io', phone: '+1 555 000 0002', totalInvested: 75000, totalProfit: -4500, roi: -6.0, coinBalance: 1240, status: 'INACTIVE', joinedAt: '2024-12-01T10:00:00Z', lastActivity: new Date(Date.now() - 14 * 86400000).toISOString() },
  { id: 'i8', firstName: 'Sara', lastName: 'Qureshi', email: 'sara@qureshi.pk', phone: '+92 300 8888888', totalInvested: 160000, totalProfit: 28800, roi: 18.0, coinBalance: 4200, status: 'ACTIVE', joinedAt: '2025-01-05T08:00:00Z', lastActivity: new Date(Date.now() - 1 * 3600000).toISOString() },
]

const SEED_WITHDRAWALS: SellerWithdrawal[] = [
  { id: 'sw1', investorId: 'i1', investorName: 'Demo Investor', amount: 15000, method: 'BANK', status: 'PENDING', accountDetails: 'IBAN: GB29 NWBK 6016 1331 9268 19', requestedAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'sw2', investorId: 'i2', investorName: 'Rachel Torres', amount: 8500, method: 'STRIPE', status: 'PENDING', accountDetails: 'Stripe ID: acct_abc123', requestedAt: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'sw3', investorId: 'i3', investorName: 'Umar Khan', amount: 3200, method: 'EASYPAISA', status: 'APPROVED', accountDetails: '+92 300 1234567', requestedAt: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: 'sw4', investorId: 'i4', investorName: 'Fatima Malik', amount: 22000, method: 'BANK', status: 'COMPLETED', accountDetails: 'IBAN: PK36 SCBL 0000 0011 2345 6702', requestedAt: new Date(Date.now() - 3 * 86400000).toISOString(), processedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'sw5', investorId: 'i5', investorName: 'John Smith', amount: 5000, method: 'JAZZCASH', status: 'REJECTED', accountDetails: '+1 555 000 0001', requestedAt: new Date(Date.now() - 4 * 86400000).toISOString(), notes: 'Account details mismatch' },
  { id: 'sw6', investorId: 'i8', investorName: 'Sara Qureshi', amount: 6800, method: 'BANK', status: 'PENDING', accountDetails: 'IBAN: PK12 MEZN 0001 4000 2501 0380', requestedAt: new Date(Date.now() - 1 * 3600000).toISOString() },
]

const SEED_TASKS: Task[] = [
  { id: 't1', title: 'Review Q1 portfolio performance', description: 'Analyze all investor portfolios and prepare Q1 report', priority: 'HIGH', status: 'TODO', assignee: 'Demo Seller', dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], tags: ['reporting', 'q1'], createdAt: new Date().toISOString() },
  { id: 't2', title: 'Onboard Rachel Torres to MetaCoin', description: 'Complete KYC and allocate initial portfolio', priority: 'HIGH', status: 'IN_PROGRESS', assignee: 'Demo Seller', dueDate: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0], tags: ['onboarding', 'kyc'], createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 't3', title: 'Update withdrawal policy docs', description: 'Reflect new processing times in investor docs', priority: 'MEDIUM', status: 'TODO', assignee: 'Demo Seller', dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], tags: ['compliance', 'docs'], createdAt: new Date().toISOString() },
  { id: 't4', title: 'Approve pending withdrawals', description: 'Process 3 outstanding withdrawal requests', priority: 'HIGH', status: 'IN_PROGRESS', assignee: 'Demo Seller', dueDate: new Date().toISOString().split('T')[0], tags: ['finance', 'urgent'], createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 't5', title: 'Set up new Meta Ads campaign tracking', description: 'Integrate Meta Ads API for real-time ROI tracking', priority: 'MEDIUM', status: 'DONE', assignee: 'Demo Seller', dueDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0], tags: ['integration', 'meta'], createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 't6', title: 'Monthly coin distribution', description: 'Distribute bonus coins to active investors', priority: 'MEDIUM', status: 'DONE', assignee: 'Demo Seller', dueDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], tags: ['coins', 'monthly'], createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: 't7', title: 'Respond to Fatima Malik inquiry', description: 'Address concerns about paused portfolio performance', priority: 'HIGH', status: 'TODO', assignee: 'Demo Seller', dueDate: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0], tags: ['investor-relations'], createdAt: new Date().toISOString() },
]

const SEED_MEETINGS: Meeting[] = [
  { id: 'm1', title: 'Portfolio Review — Demo Investor', type: 'VIDEO', attendees: ['Demo Investor', 'Demo Seller'], date: new Date(Date.now() + 2 * 3600000).toISOString(), duration: 45, status: 'UPCOMING', link: 'https://meet.google.com/abc-defg-hij', createdAt: new Date().toISOString() },
  { id: 'm2', title: 'Onboarding Call — Rachel Torres', type: 'PHONE', attendees: ['Rachel Torres', 'Demo Seller'], date: new Date(Date.now() + 25 * 3600000).toISOString(), duration: 30, status: 'UPCOMING', createdAt: new Date().toISOString() },
  { id: 'm3', title: 'Q1 Strategy Session', type: 'VIDEO', attendees: ['Umar Khan', 'John Smith', 'Demo Seller'], date: new Date(Date.now() + 3 * 86400000).toISOString(), duration: 60, status: 'UPCOMING', link: 'https://zoom.us/j/123456', createdAt: new Date().toISOString() },
  { id: 'm4', title: 'Risk Review — Fatima Malik', type: 'IN_PERSON', attendees: ['Fatima Malik', 'Demo Seller'], date: new Date(Date.now() - 1 * 86400000).toISOString(), duration: 60, status: 'COMPLETED', notes: 'Agreed to rebalance portfolio towards stable assets', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'm5', title: 'KYC Verification — Sara Qureshi', type: 'VIDEO', attendees: ['Sara Qureshi', 'Demo Seller'], date: new Date(Date.now() - 2 * 86400000).toISOString(), duration: 20, status: 'COMPLETED', notes: 'All documents verified. Portfolio access granted.', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
]

const SEED_CONTACTS: TeamContact[] = [
  { id: 'i1', name: 'Demo Investor', role: 'Investor', status: 'ONLINE', unread: 2, lastMessage: 'When will my withdrawal be processed?', lastSeen: new Date().toISOString() },
  { id: 'i2', name: 'Rachel Torres', role: 'Investor', status: 'AWAY', unread: 0, lastMessage: 'Thank you for the update!', lastSeen: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: 'i3', name: 'Umar Khan', role: 'Investor', status: 'OFFLINE', unread: 1, lastMessage: 'Can we schedule a call?', lastSeen: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: 'i4', name: 'Fatima Malik', role: 'Investor', status: 'OFFLINE', unread: 0, lastMessage: 'Understood, I will wait for your review.', lastSeen: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: 'i5', name: 'Sara Qureshi', role: 'Investor', status: 'ONLINE', unread: 0, lastMessage: 'Portfolio looks great this month!', lastSeen: new Date().toISOString() },
]

const SEED_MESSAGES: TeamMessage[] = [
  { id: 'msg1', contactId: 'i1', senderId: 'i1', senderName: 'Demo Investor', senderRole: 'INVESTOR', content: 'Hi, I submitted a withdrawal request 2 hours ago. When will it be processed?', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), read: false },
  { id: 'msg2', contactId: 'i1', senderId: 'seller', senderName: 'Demo Seller', senderRole: 'SELLER', content: 'Hi! I\'m reviewing it now. Withdrawals typically take 1-2 business days. I\'ll keep you updated!', timestamp: new Date(Date.now() - 1.5 * 3600000).toISOString(), read: true },
  { id: 'msg3', contactId: 'i1', senderId: 'i1', senderName: 'Demo Investor', senderRole: 'INVESTOR', content: 'When will my withdrawal be processed?', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), read: false },
  { id: 'msg4', contactId: 'i2', senderId: 'seller', senderName: 'Demo Seller', senderRole: 'SELLER', content: 'Your portfolio is performing well this month! Up 3.2% from last week.', timestamp: new Date(Date.now() - 1 * 3600000).toISOString(), read: true },
  { id: 'msg5', contactId: 'i2', senderId: 'i2', senderName: 'Rachel Torres', senderRole: 'INVESTOR', content: 'Thank you for the update!', timestamp: new Date(Date.now() - 45 * 60000).toISOString(), read: true },
  { id: 'msg6', contactId: 'i3', senderId: 'i3', senderName: 'Umar Khan', senderRole: 'INVESTOR', content: 'Can we schedule a call?', timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), read: false },
]

const SEED_INVESTMENTS: SellerInvestment[] = [
  { id: 'inv1', channel: 'META_ADS', channelColor: '#1877F2', totalInvested: 920000, currentValue: 1047800, pnl: 127800, pnlPercent: 13.89, investorCount: 32, trend: genTrend(1047800) },
  { id: 'inv2', channel: 'TIKTOK_ADS', channelColor: '#69C9D0', totalInvested: 480000, currentValue: 523200, pnl: 43200, pnlPercent: 9.0, investorCount: 18, trend: genTrend(523200) },
  { id: 'inv3', channel: 'GOOGLE_ADS', channelColor: '#4285F4', totalInvested: 680000, currentValue: 782000, pnl: 102000, pnlPercent: 15.0, investorCount: 24, trend: genTrend(782000) },
  { id: 'inv4', channel: 'WHATSAPP', channelColor: '#25D366', totalInvested: 220000, currentValue: 210800, pnl: -9200, pnlPercent: -4.18, investorCount: 8, trend: genTrend(210800) },
  { id: 'inv5', channel: 'OTHER', channelColor: '#8B5CF6', totalInvested: 180000, currentValue: 162000, pnl: -18000, pnlPercent: -10.0, investorCount: 5, trend: genTrend(162000) },
]

// ── Store ──────────────────────────────────────────────────────────────────────

interface SellerState {
  coins: SellerCoin[]
  investors: SellerInvestor[]
  withdrawals: SellerWithdrawal[]
  tasks: Task[]
  meetings: Meeting[]
  contacts: TeamContact[]
  messages: TeamMessage[]
  investments: SellerInvestment[]

  // Coins
  createCoin: (coin: Omit<SellerCoin, 'id' | 'createdAt' | 'totalSupply' | 'currentPrice' | 'isActive'>) => void
  updateCoin: (id: string, updates: Partial<SellerCoin>) => void
  deleteCoin: (id: string) => void
  toggleCoinActive: (id: string) => void

  // Investors
  updateInvestorStatus: (id: string, status: SellerInvestor['status']) => void
  addCoinToInvestor: (investorId: string, amount: number) => void

  // Withdrawals
  approveWithdrawal: (id: string) => void
  rejectWithdrawal: (id: string, notes?: string) => void
  markWithdrawalCompleted: (id: string) => void

  // Tasks
  createTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  updateTaskStatus: (id: string, status: Task['status']) => void
  deleteTask: (id: string) => void
  updateTask: (id: string, updates: Partial<Task>) => void

  // Meetings
  createMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt'>) => void
  completeMeeting: (id: string, notes?: string) => void
  cancelMeeting: (id: string) => void

  // Team messages
  sendMessage: (contactId: string, content: string) => void
  markContactRead: (contactId: string) => void
}

export const useSellerStore = create<SellerState>()(
  persist(
    (set, get) => ({
      coins: SEED_COINS,
      investors: SEED_INVESTORS,
      withdrawals: SEED_WITHDRAWALS,
      tasks: SEED_TASKS,
      meetings: SEED_MEETINGS,
      contacts: SEED_CONTACTS,
      messages: SEED_MESSAGES,
      investments: SEED_INVESTMENTS,

      // ── Coins ────────────────────────────────────────────────────────────
      createCoin: (coin) => {
        const newCoin: SellerCoin = {
          ...coin,
          id: `c_${Date.now()}`,
          totalSupply: Math.floor(Math.random() * 500000) + 100000,
          currentPrice: parseFloat((Math.random() * 3 + 0.5).toFixed(2)),
          isActive: true,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ coins: [newCoin, ...s.coins] }))
      },
      updateCoin: (id, updates) => {
        set((s) => ({ coins: s.coins.map((c) => c.id === id ? { ...c, ...updates } : c) }))
      },
      deleteCoin: (id) => {
        set((s) => ({ coins: s.coins.filter((c) => c.id !== id) }))
      },
      toggleCoinActive: (id) => {
        set((s) => ({ coins: s.coins.map((c) => c.id === id ? { ...c, isActive: !c.isActive } : c) }))
      },

      // ── Investors ────────────────────────────────────────────────────────
      updateInvestorStatus: (id, status) => {
        set((s) => ({ investors: s.investors.map((inv) => inv.id === id ? { ...inv, status } : inv) }))
      },
      addCoinToInvestor: (investorId, amount) => {
        set((s) => ({ investors: s.investors.map((inv) => inv.id === investorId ? { ...inv, coinBalance: inv.coinBalance + amount } : inv) }))
      },

      // ── Withdrawals ───────────────────────────────────────────────────────
      approveWithdrawal: (id) => {
        set((s) => ({ withdrawals: s.withdrawals.map((w) => w.id === id ? { ...w, status: 'APPROVED' as const } : w) }))
      },
      rejectWithdrawal: (id, notes) => {
        set((s) => ({ withdrawals: s.withdrawals.map((w) => w.id === id ? { ...w, status: 'REJECTED' as const, notes } : w) }))
      },
      markWithdrawalCompleted: (id) => {
        set((s) => ({ withdrawals: s.withdrawals.map((w) => w.id === id ? { ...w, status: 'COMPLETED' as const, processedAt: new Date().toISOString() } : w) }))
      },

      // ── Tasks ─────────────────────────────────────────────────────────────
      createTask: (task) => {
        const newTask: Task = { ...task, id: `t_${Date.now()}`, createdAt: new Date().toISOString() }
        set((s) => ({ tasks: [newTask, ...s.tasks] }))
      },
      updateTaskStatus: (id, status) => {
        set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, status } : t) }))
      },
      deleteTask: (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
      },
      updateTask: (id, updates) => {
        set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates } : t) }))
      },

      // ── Meetings ──────────────────────────────────────────────────────────
      createMeeting: (meeting) => {
        const newMeeting: Meeting = { ...meeting, id: `m_${Date.now()}`, createdAt: new Date().toISOString() }
        set((s) => ({ meetings: [newMeeting, ...s.meetings] }))
      },
      completeMeeting: (id, notes) => {
        set((s) => ({ meetings: s.meetings.map((m) => m.id === id ? { ...m, status: 'COMPLETED' as const, notes: notes || m.notes } : m) }))
      },
      cancelMeeting: (id) => {
        set((s) => ({ meetings: s.meetings.map((m) => m.id === id ? { ...m, status: 'CANCELLED' as const } : m) }))
      },

      // ── Team messages ─────────────────────────────────────────────────────
      sendMessage: (contactId, content) => {
        const newMsg: TeamMessage = {
          id: `msg_${Date.now()}`,
          contactId,
          senderId: 'seller',
          senderName: 'Demo Seller',
          senderRole: 'SELLER',
          content,
          timestamp: new Date().toISOString(),
          read: true,
        }
        set((s) => ({
          messages: [...s.messages, newMsg],
          contacts: s.contacts.map((c) => c.id === contactId ? { ...c, lastMessage: content } : c),
        }))
      },
      markContactRead: (contactId) => {
        set((s) => ({
          contacts: s.contacts.map((c) => c.id === contactId ? { ...c, unread: 0 } : c),
          messages: s.messages.map((m) => m.contactId === contactId ? { ...m, read: true } : m),
        }))
      },
    }),
    {
      name: 'investor-panel-seller',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
