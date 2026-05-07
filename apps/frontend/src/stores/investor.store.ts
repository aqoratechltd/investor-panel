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
  isLoaded: boolean

  // Initialise from Firestore for a given user
  initialize: (userId: string) => Promise<void>

  // Investments
  addInvestment: (investment: Omit<InvestorInvestment, 'id' | 'trend'>) => void

  // Transactions
  addTransaction: (tx: Omit<InvestorTransaction, 'id' | 'date'>) => void

  // Withdrawals
  requestWithdrawal: (userId: string, amount: number, method: InvestorWithdrawal['method'], accountDetails: string) => Promise<void>
  cancelWithdrawal: (id: string) => Promise<void>

  // Coins
  earnCoins: (userId: string, amount: number, description: string, source: CoinHistory['source']) => Promise<void>
  spendCoins: (userId: string, amount: number, description: string) => Promise<boolean>

  // Withdrawal methods
  addWithdrawalMethod: (method: Omit<WithdrawalMethod, 'id'>) => void
  removeWithdrawalMethod: (id: string) => void
  setDefaultMethod: (id: string) => void
}

export const useInvestorStore = create<InvestorState>()(
  persist(
    (set, get) => ({
      investments: [],
      transactions: [],
      withdrawals: [],
      coinHistory: [],
      badges: [],
      withdrawalMethods: [],
      coinBalance: 0,
      availableBalance: 0,
      isLoaded: false,

      // ── Initialize from Firestore ─────────────────────────────────────────
      initialize: async (userId: string) => {
        if (!userId) return
        try {
          const { db } = await import('@/lib/firebase')
          const {
            collection, query, where, orderBy, getDocs, getDoc, doc,
          } = await import('firebase/firestore')

          const [txSnap, wdSnap, coinSnap, badgeSnap, flagSnap, wdMethodSnap] = await Promise.all([
            // Transactions
            getDocs(query(
              collection(db, 'transactions'),
              where('investorId', '==', userId),
              orderBy('createdAt', 'desc'),
            )).catch(() => null),
            // Withdrawals
            getDocs(query(
              collection(db, 'withdrawals'),
              where('investorId', '==', userId),
              orderBy('requestedAt', 'desc'),
            )).catch(() => null),
            // Coin history
            getDocs(query(
              collection(db, 'coin_history'),
              where('userId', '==', userId),
              orderBy('createdAt', 'desc'),
            )).catch(() => null),
            // Badges
            getDocs(query(
              collection(db, 'badges'),
              where('userId', '==', userId),
            )).catch(() => null),
            // User flags (balance)
            getDoc(doc(db, 'user_flags', userId)).catch(() => null),
            // Withdrawal methods
            getDocs(query(
              collection(db, 'withdrawal_methods'),
              where('userId', '==', userId),
            )).catch(() => null),
          ])

          const transactions: InvestorTransaction[] = txSnap
            ? txSnap.docs.map(d => {
                const data = d.data()
                return {
                  id: d.id,
                  type: data.type,
                  description: data.description || '',
                  amount: data.amount || 0,
                  coinAmount: data.coinAmount,
                  status: data.status || 'COMPLETED',
                  date: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? new Date().toISOString(),
                  reference: data.reference,
                }
              })
            : []

          const withdrawals: InvestorWithdrawal[] = wdSnap
            ? wdSnap.docs.map(d => {
                const data = d.data()
                return {
                  id: d.id,
                  amount: data.amount || 0,
                  method: data.method || 'BANK',
                  accountDetails: data.accountDetails || '',
                  status: data.status || 'PENDING',
                  requestedAt: data.requestedAt?.toDate?.()?.toISOString?.() ?? data.requestedAt ?? new Date().toISOString(),
                  processedAt: data.processedAt?.toDate?.()?.toISOString?.() ?? data.processedAt,
                  notes: data.notes,
                }
              })
            : []

          const coinHistory: CoinHistory[] = coinSnap
            ? coinSnap.docs.map(d => {
                const data = d.data()
                return {
                  id: d.id,
                  type: data.type || 'EARNED',
                  amount: data.amount || 0,
                  description: data.description || '',
                  date: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? new Date().toISOString(),
                  source: data.source || 'INVESTMENT',
                }
              })
            : []

          const badges: Badge[] = badgeSnap
            ? badgeSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Badge)
            : []

          const flagData = flagSnap?.exists() ? flagSnap.data() : {}
          const coinBalance = flagData?.coinBalance ?? 0
          const availableBalance = flagData?.availableBalance ?? 0

          const withdrawalMethods: WithdrawalMethod[] = wdMethodSnap
            ? wdMethodSnap.docs.map(d => ({ id: d.id, ...d.data() }) as WithdrawalMethod)
            : []

          set({
            transactions,
            withdrawals,
            coinHistory,
            badges,
            coinBalance,
            availableBalance,
            withdrawalMethods,
            isLoaded: true,
          })
        } catch (e) {
          console.error('[InvestorStore] initialize error:', e)
          set({ isLoaded: true })
        }
      },

      // ── Investments ───────────────────────────────────────────────────────
      addInvestment: (investment) => {
        const newInvestment: InvestorInvestment = {
          ...investment,
          id: `inv_${Date.now()}`,
          trend: [],
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
      requestWithdrawal: async (userId, amount, method, accountDetails) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { collection, addDoc, doc, updateDoc, increment, serverTimestamp } = await import('firebase/firestore')

          const ref = await addDoc(collection(db, 'withdrawals'), {
            investorId: userId,
            amount,
            method,
            accountDetails,
            status: 'PENDING',
            requestedAt: serverTimestamp(),
            processedAt: null,
            notes: null,
          })

          // Deduct from available balance
          await updateDoc(doc(db, 'user_flags', userId), {
            availableBalance: increment(-amount),
          })

          // Log transaction
          await addDoc(collection(db, 'transactions'), {
            investorId: userId,
            type: 'WITHDRAWAL',
            description: `Withdrawal via ${method} — $${amount.toLocaleString()}`,
            amount: -amount,
            status: 'PENDING',
            reference: `WD-${Date.now()}`,
            createdAt: serverTimestamp(),
          })

          const newWithdrawal: InvestorWithdrawal = {
            id: ref.id,
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
        } catch (e) {
          console.error('[InvestorStore] requestWithdrawal error:', e)
          throw e
        }
      },

      cancelWithdrawal: async (id) => {
        const w = get().withdrawals.find((w) => w.id === id)
        if (!w || w.status !== 'PENDING') return
        try {
          const { db } = await import('@/lib/firebase')
          const { doc, updateDoc } = await import('firebase/firestore')
          await updateDoc(doc(db, 'withdrawals', id), { status: 'REJECTED' })
          set((s) => ({
            withdrawals: s.withdrawals.map((w) => w.id === id ? { ...w, status: 'REJECTED' as const } : w),
            availableBalance: s.availableBalance + w.amount,
          }))
        } catch (e) {
          console.error('[InvestorStore] cancelWithdrawal error:', e)
          throw e
        }
      },

      // ── Coins ─────────────────────────────────────────────────────────────
      earnCoins: async (userId, amount, description, source) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { collection, addDoc, doc, setDoc, increment, serverTimestamp } = await import('firebase/firestore')

          await addDoc(collection(db, 'coin_history'), {
            userId,
            type: 'EARNED',
            amount,
            description,
            source,
            createdAt: serverTimestamp(),
          })

          await setDoc(doc(db, 'user_flags', userId), {
            coinBalance: increment(amount),
            userId,
          }, { merge: true })

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
        } catch (e) {
          console.error('[InvestorStore] earnCoins error:', e)
          throw e
        }
      },

      spendCoins: async (userId, amount, description) => {
        if (get().coinBalance < amount) return false
        try {
          const { db } = await import('@/lib/firebase')
          const { collection, addDoc, doc, setDoc, increment, serverTimestamp } = await import('firebase/firestore')

          await addDoc(collection(db, 'coin_history'), {
            userId,
            type: 'SPENT',
            amount: -amount,
            description,
            source: 'REDEMPTION',
            createdAt: serverTimestamp(),
          })

          await setDoc(doc(db, 'user_flags', userId), {
            coinBalance: increment(-amount),
            userId,
          }, { merge: true })

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
        } catch (e) {
          console.error('[InvestorStore] spendCoins error:', e)
          return false
        }
      },

      // ── Withdrawal methods ────────────────────────────────────────────────
      addWithdrawalMethod: (method) => {
        const newMethod: WithdrawalMethod = { ...method, id: `wm_${Date.now()}` }
        set((s) => ({ withdrawalMethods: [...s.withdrawalMethods, newMethod] }))
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
      // Only persist lightweight state, not the full data arrays
      partialize: (state) => ({
        coinBalance: state.coinBalance,
        availableBalance: state.availableBalance,
        withdrawalMethods: state.withdrawalMethods,
      }),
    },
  ),
)
