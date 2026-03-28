import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InvestorInvestment {
  id: string
  name: string
  symbol: string
  icon: string
  iconColor: string
  channel: string
  invested: number
  currentValue: number
  pnl: number
  pnlPercent: number
  allocation: number
  units: number
  returnRate: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  startDate: string
  trend: Array<{ date: string; value: number }>
}

export interface InvestorTransaction {
  id: string
  type: 'INVESTMENT' | 'PROFIT' | 'WITHDRAWAL' | 'COIN_EARN' | 'COIN_SPEND' | 'DEPOSIT'
  description: string
  amount: number
  coinAmount?: number
  status: 'COMPLETED' | 'PENDING' | 'FAILED'
  date: string
  reference?: string
}

export interface InvestorWithdrawal {
  id: string
  amount: number
  method: 'BANK' | 'EASYPAISA' | 'JAZZCASH' | 'STRIPE'
  accountDetails: string
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED'
  requestedAt: string
  processedAt?: string
  notes?: string
}

export interface CoinHistory {
  id: string
  type: 'EARNED' | 'SPENT'
  amount: number
  description: string
  date: string
  source: 'INVESTMENT' | 'REFERRAL' | 'MILESTONE' | 'AD_INTERACTION' | 'LOYALTY' | 'PROMO' | 'REDEMPTION'
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY'
  earned: boolean
  earnedAt?: string
  progress?: number
  requirement?: string
}

export interface WithdrawalMethod {
  id: string
  type: 'BANK' | 'EASYPAISA' | 'JAZZCASH' | 'STRIPE'
  label: string
  accountDetails: string
  isDefault: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function genTrend(base: number, days = 30): Array<{ date: string; value: number }> {
  const arr: Array<{ date: string; value: number }> = []
  let v = base * 0.88
  for (let i = days; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    v = v * (1 + (Math.random() - 0.44) * 0.035)
    arr.push({ date: d.toISOString().split('T')[0], value: Math.round(v * 100) / 100 })
  }
  return arr
}

// ── Seed data ──────────────────────────────────────────────────────────────────

const SEED_INVESTMENTS: InvestorInvestment[] = [
  { id: 'inv1', name: 'MetaGrowth Token', symbol: 'MGT', icon: '🎯', iconColor: '#06b6d4', channel: 'META_ADS', invested: 50000, currentValue: 51800, pnl: 1800, pnlPercent: 3.6, allocation: 20.1, units: 40322, returnRate: 18.4, riskLevel: 'MEDIUM', startDate: '2025-01-10', trend: genTrend(51800) },
  { id: 'inv2', name: 'AlphaScale Ventures', symbol: 'ASV', icon: '📈', iconColor: '#10b981', channel: 'GOOGLE_ADS', invested: 100000, currentValue: 113200, pnl: 13200, pnlPercent: 13.2, allocation: 40.2, units: 1132, returnRate: 24.1, riskLevel: 'MEDIUM', startDate: '2025-01-10', trend: genTrend(113200) },
  { id: 'inv3', name: 'StableYield Coin', symbol: 'SYC', icon: '💎', iconColor: '#8b5cf6', channel: 'STABLE', invested: 60000, currentValue: 65400, pnl: 5400, pnlPercent: 9.0, allocation: 24.1, units: 66734, returnRate: 8.6, riskLevel: 'LOW', startDate: '2025-01-15', trend: genTrend(65400) },
  { id: 'inv4', name: 'GreenVolt Energy', symbol: 'GVE', icon: '⚡', iconColor: '#f59e0b', channel: 'ESG', invested: 25000, currentValue: 27800, pnl: 2800, pnlPercent: 11.2, allocation: 10.1, units: 556, returnRate: 19.8, riskLevel: 'LOW', startDate: '2025-02-01', trend: genTrend(27800) },
  { id: 'inv5', name: 'TikTok Ads Pool', symbol: 'TAP', icon: '🎵', iconColor: '#ef4444', channel: 'TIKTOK_ADS', invested: 13500, currentValue: 12140, pnl: -1360, pnlPercent: -10.1, allocation: 5.5, units: 12387, returnRate: 14.9, riskLevel: 'HIGH', startDate: '2025-02-10', trend: genTrend(12140) },
]

const SEED_TRANSACTIONS: InvestorTransaction[] = [
  { id: 'tx1', type: 'PROFIT', description: 'MetaGrowth Token — Monthly profit distribution', amount: 920, status: 'COMPLETED', date: new Date(Date.now() - 1 * 86400000).toISOString(), reference: 'TXN-2025-0001' },
  { id: 'tx2', type: 'COIN_EARN', description: 'Bonus coins for 6-month anniversary', amount: 0, coinAmount: 500, status: 'COMPLETED', date: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'tx3', type: 'PROFIT', description: 'AlphaScale Ventures — Quarterly dividend', amount: 3200, status: 'COMPLETED', date: new Date(Date.now() - 3 * 86400000).toISOString(), reference: 'TXN-2025-0002' },
  { id: 'tx4', type: 'WITHDRAWAL', description: 'Withdrawal to bank account (IBAN: GB29...)', amount: -5000, status: 'COMPLETED', date: new Date(Date.now() - 5 * 86400000).toISOString(), reference: 'WD-2025-0001' },
  { id: 'tx5', type: 'COIN_EARN', description: 'Referral bonus — Umar Khan joined', amount: 0, coinAmount: 200, status: 'COMPLETED', date: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: 'tx6', type: 'INVESTMENT', description: 'Initial investment — GreenVolt Energy', amount: -25000, status: 'COMPLETED', date: new Date(Date.now() - 8 * 86400000).toISOString(), reference: 'INV-2025-0003' },
  { id: 'tx7', type: 'PROFIT', description: 'StableYield Coin — Weekly yield', amount: 540, status: 'COMPLETED', date: new Date(Date.now() - 9 * 86400000).toISOString(), reference: 'TXN-2025-0003' },
  { id: 'tx8', type: 'DEPOSIT', description: 'Wallet top-up via bank transfer', amount: 20000, status: 'COMPLETED', date: new Date(Date.now() - 14 * 86400000).toISOString(), reference: 'DEP-2025-0001' },
  { id: 'tx9', type: 'INVESTMENT', description: 'Initial investment — TikTok Ads Pool', amount: -13500, status: 'COMPLETED', date: new Date(Date.now() - 15 * 86400000).toISOString(), reference: 'INV-2025-0005' },
  { id: 'tx10', type: 'COIN_EARN', description: 'Ad interaction reward', amount: 0, coinAmount: 50, status: 'COMPLETED', date: new Date(Date.now() - 16 * 86400000).toISOString() },
]

const SEED_WITHDRAWALS: InvestorWithdrawal[] = [
  { id: 'iw1', amount: 5000, method: 'BANK', accountDetails: 'IBAN: GB29 NWBK 6016 1331 9268 19', status: 'COMPLETED', requestedAt: new Date(Date.now() - 5 * 86400000).toISOString(), processedAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: 'iw2', amount: 2500, method: 'EASYPAISA', accountDetails: '+92 300 1234567', status: 'COMPLETED', requestedAt: new Date(Date.now() - 12 * 86400000).toISOString(), processedAt: new Date(Date.now() - 11 * 86400000).toISOString() },
  { id: 'iw3', amount: 1000, method: 'JAZZCASH', accountDetails: '+92 333 5555555', status: 'REJECTED', requestedAt: new Date(Date.now() - 20 * 86400000).toISOString(), notes: 'Account name mismatch' },
]

const SEED_COIN_HISTORY: CoinHistory[] = [
  { id: 'ch1', type: 'EARNED', amount: 500, description: '6-month anniversary bonus', date: new Date(Date.now() - 2 * 86400000).toISOString(), source: 'MILESTONE' },
  { id: 'ch2', type: 'EARNED', amount: 200, description: 'Referral — Umar Khan joined', date: new Date(Date.now() - 6 * 86400000).toISOString(), source: 'REFERRAL' },
  { id: 'ch3', type: 'EARNED', amount: 50, description: 'Ad interaction reward', date: new Date(Date.now() - 16 * 86400000).toISOString(), source: 'AD_INTERACTION' },
  { id: 'ch4', type: 'EARNED', amount: 420, description: 'First investment milestone', date: new Date(Date.now() - 30 * 86400000).toISOString(), source: 'MILESTONE' },
  { id: 'ch5', type: 'EARNED', amount: 100, description: 'Monthly loyalty reward', date: new Date(Date.now() - 35 * 86400000).toISOString(), source: 'LOYALTY' },
  { id: 'ch6', type: 'SPENT', amount: -250, description: 'Redeemed for $25 account credit', date: new Date(Date.now() - 40 * 86400000).toISOString(), source: 'REDEMPTION' },
  { id: 'ch7', type: 'EARNED', amount: 3400, description: 'Investment allocation reward (10 coins per $1K)', date: new Date(Date.now() - 45 * 86400000).toISOString(), source: 'INVESTMENT' },
]

const SEED_BADGES: Badge[] = [
  { id: 'b1', name: 'First Investment', description: 'Made your first investment on InvestorPanel', icon: '🎯', color: 'from-brand-400 to-brand-600', rarity: 'COMMON', earned: true, earnedAt: '2025-01-10T09:00:00Z' },
  { id: 'b2', name: 'Early Adopter', description: 'Joined InvestorPanel in the first 3 months', icon: '🚀', color: 'from-violet-400 to-violet-600', rarity: 'UNCOMMON', earned: true, earnedAt: '2025-01-10T09:00:00Z' },
  { id: 'b3', name: 'Coin Collector', description: 'Accumulated 5,000 coins', icon: '🪙', color: 'from-amber-400 to-amber-600', rarity: 'UNCOMMON', earned: true, earnedAt: '2025-02-20T10:00:00Z' },
  { id: 'b4', name: '6-Month Investor', description: 'Maintained active investments for 6 months', icon: '📅', color: 'from-emerald-400 to-emerald-600', rarity: 'RARE', earned: false, progress: 65, requirement: 'Active for 6 months (65% complete)' },
  { id: 'b5', name: 'Referral Champion', description: 'Referred 5 investors to the platform', icon: '🏆', color: 'from-rose-400 to-rose-600', rarity: 'RARE', earned: false, progress: 20, requirement: 'Refer 5 investors (1/5 complete)' },
  { id: 'b6', name: 'Diamond Hands', description: 'Never withdrew during a market dip', icon: '💎', color: 'from-sky-400 to-sky-600', rarity: 'UNCOMMON', earned: true, earnedAt: '2025-03-01T00:00:00Z' },
  { id: 'b7', name: 'Portfolio Pro', description: 'Invested in 5 or more different assets', icon: '📊', color: 'from-indigo-400 to-indigo-600', rarity: 'COMMON', earned: true, earnedAt: '2025-02-10T00:00:00Z' },
  { id: 'b8', name: 'Whale', description: 'Total investments exceed $500,000', icon: '🐋', color: 'from-blue-400 to-blue-600', rarity: 'LEGENDARY', earned: false, progress: 50, requirement: '$500K total invested ($248.5K/$500K)' },
]

const SEED_WITHDRAWAL_METHODS: WithdrawalMethod[] = [
  { id: 'wm1', type: 'BANK', label: 'HSBC Bank Account', accountDetails: 'IBAN: GB29 NWBK 6016 1331 9268 19', isDefault: true },
  { id: 'wm2', type: 'EASYPAISA', label: 'EasyPaisa Mobile', accountDetails: '+92 300 1234567', isDefault: false },
]

// ── Store ──────────────────────────────────────────────────────────────────────

interface InvestorState {
  investments: InvestorInvestment[]
  transactions: InvestorTransaction[]
  withdrawals: InvestorWithdrawal[]
  coinHistory: CoinHistory[]
  badges: Badge[]
  withdrawalMethods: WithdrawalMethod[]
  coinBalance: number
  availableBalance: number

  // Investments
  addInvestment: (investment: Omit<InvestorInvestment, 'id' | 'trend'>) => void

  // Transactions
  addTransaction: (tx: Omit<InvestorTransaction, 'id' | 'date'>) => void

  // Withdrawals
  requestWithdrawal: (amount: number, method: InvestorWithdrawal['method'], accountDetails: string) => void
  cancelWithdrawal: (id: string) => void

  // Coins
  earnCoins: (amount: number, description: string, source: CoinHistory['source']) => void
  spendCoins: (amount: number, description: string) => boolean

  // Withdrawal methods
  addWithdrawalMethod: (method: Omit<WithdrawalMethod, 'id'>) => void
  removeWithdrawalMethod: (id: string) => void
  setDefaultMethod: (id: string) => void
}

export const useInvestorStore = create<InvestorState>()(
  persist(
    (set, get) => ({
      investments: SEED_INVESTMENTS,
      transactions: SEED_TRANSACTIONS,
      withdrawals: SEED_WITHDRAWALS,
      coinHistory: SEED_COIN_HISTORY,
      badges: SEED_BADGES,
      withdrawalMethods: SEED_WITHDRAWAL_METHODS,
      coinBalance: 4420,
      availableBalance: 32840,

      // ── Investments ───────────────────────────────────────────────────────
      addInvestment: (investment) => {
        const newInvestment: InvestorInvestment = {
          ...investment,
          id: `inv_${Date.now()}`,
          trend: genTrend(investment.currentValue),
        }
        set((s) => ({ investments: [newInvestment, ...s.investments] }))
      },

      // ── Transactions ──────────────────────────────────────────────────────
      addTransaction: (tx) => {
        const newTx: InvestorTransaction = {
          ...tx,
          id: `tx_${Date.now()}`,
          date: new Date().toISOString(),
          reference: `TXN-${Date.now()}`,
        }
        set((s) => ({ transactions: [newTx, ...s.transactions] }))
      },

      // ── Withdrawals ───────────────────────────────────────────────────────
      requestWithdrawal: (amount, method, accountDetails) => {
        const newWithdrawal: InvestorWithdrawal = {
          id: `iw_${Date.now()}`,
          amount,
          method,
          accountDetails,
          status: 'PENDING',
          requestedAt: new Date().toISOString(),
        }
        set((s) => ({
          withdrawals: [newWithdrawal, ...s.withdrawals],
          availableBalance: Math.max(0, s.availableBalance - amount),
        }))
        get().addTransaction({
          type: 'WITHDRAWAL',
          description: `Withdrawal request via ${method} — $${amount.toLocaleString()}`,
          amount: -amount,
          status: 'PENDING',
        })
      },
      cancelWithdrawal: (id) => {
        const w = get().withdrawals.find((w) => w.id === id)
        if (!w || w.status !== 'PENDING') return
        set((s) => ({
          withdrawals: s.withdrawals.map((w) => w.id === id ? { ...w, status: 'REJECTED' as const } : w),
          availableBalance: s.availableBalance + w.amount,
        }))
      },

      // ── Coins ─────────────────────────────────────────────────────────────
      earnCoins: (amount, description, source) => {
        const entry: CoinHistory = {
          id: `ch_${Date.now()}`,
          type: 'EARNED',
          amount,
          description,
          date: new Date().toISOString(),
          source,
        }
        set((s) => ({
          coinBalance: s.coinBalance + amount,
          coinHistory: [entry, ...s.coinHistory],
        }))
      },
      spendCoins: (amount, description) => {
        if (get().coinBalance < amount) return false
        const entry: CoinHistory = {
          id: `ch_${Date.now()}`,
          type: 'SPENT',
          amount: -amount,
          description,
          date: new Date().toISOString(),
          source: 'REDEMPTION',
        }
        set((s) => ({
          coinBalance: s.coinBalance - amount,
          coinHistory: [entry, ...s.coinHistory],
        }))
        return true
      },

      // ── Withdrawal methods ────────────────────────────────────────────────
      addWithdrawalMethod: (method) => {
        const newMethod: WithdrawalMethod = { ...method, id: `wm_${Date.now()}` }
        set((s) => ({
          withdrawalMethods: [...s.withdrawalMethods, newMethod],
        }))
      },
      removeWithdrawalMethod: (id) => {
        set((s) => ({ withdrawalMethods: s.withdrawalMethods.filter((m) => m.id !== id) }))
      },
      setDefaultMethod: (id) => {
        set((s) => ({
          withdrawalMethods: s.withdrawalMethods.map((m) => ({ ...m, isDefault: m.id === id })),
        }))
      },
    }),
    {
      name: 'investor-panel-investor',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
