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
  investorId: string
  sellerName: string
  sellerId?: string
  amount: number
  method: 'BANK' | 'EASYPAISA' | 'JAZZCASH' | 'STRIPE'
  status: 'PENDING' | 'PROCESSING' | 'APPROVED' | 'COMPLETED' | 'REJECTED'
  accountDetails: string
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

// ── Store ─────────────────────────────────────────────────────────────────────

interface AdminState {
  sellers: Seller[]
  withdrawals: AdminWithdrawal[]
  ads: Ad[]
  logs: ActivityLog[]
  subscriptions: Subscription[]
  isLoaded: boolean

  initialize: () => Promise<void>

  // Sellers
  approveSeller: (id: string) => void
  suspendSeller: (id: string) => void
  unsuspendSeller: (id: string) => void
  deleteSeller: (id: string) => void
  addSeller: (seller: Omit<Seller, 'id' | 'createdAt' | 'investors' | 'totalInvested'>) => void

  // Withdrawals
  approveWithdrawal: (id: string) => Promise<void>
  rejectWithdrawal: (id: string, notes?: string) => Promise<void>
  markWithdrawalProcessing: (id: string) => Promise<void>
  markWithdrawalCompleted: (id: string) => Promise<void>

  // Ads
  createAd: (ad: Omit<Ad, 'id' | 'impressions' | 'clicks' | 'createdAt'>) => Promise<void>
  toggleAdStatus: (id: string) => Promise<void>
  deleteAd: (id: string) => Promise<void>
  incrementAdImpression: (id: string) => void
  incrementAdClick: (id: string) => void

  // Logs
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => Promise<void>

  // Subscriptions
  cancelSubscription: (id: string) => Promise<void>
  updatePlan: (id: string, plan: Subscription['plan']) => Promise<void>
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      sellers: [],
      withdrawals: [],
      ads: [],
      logs: [],
      subscriptions: [],
      isLoaded: false,

      // ── Initialize from Firestore ─────────────────────────────────────────
      initialize: async () => {
        try {
          const { db } = await import('@/lib/firebase')
          const { collection, query, orderBy, getDocs, where } = await import('firebase/firestore')

          const [wdSnap, adSnap, logSnap, subSnap, userSnap] = await Promise.all([
            // All withdrawals platform-wide
            getDocs(query(
              collection(db, 'withdrawals'),
              orderBy('requestedAt', 'desc'),
            )).catch(() => null),
            // Ads
            getDocs(query(
              collection(db, 'ads'),
              orderBy('createdAt', 'desc'),
            )).catch(() => null),
            // Activity logs (violations + admin actions)
            getDocs(query(
              collection(db, 'violations'),
              orderBy('createdAt', 'desc'),
            )).catch(() => null),
            // Subscriptions
            getDocs(query(
              collection(db, 'subscriptions'),
              orderBy('startedAt', 'desc'),
            )).catch(() => null),
            // Sellers (users with role = SELLER)
            getDocs(query(
              collection(db, 'users'),
              where('role', '==', 'SELLER'),
            )).catch(() => null),
          ])

          const withdrawals: AdminWithdrawal[] = wdSnap
            ? wdSnap.docs.map(d => {
                const data = d.data()
                return {
                  id: d.id,
                  investorId: data.investorId || '',
                  investorName: data.investorName || 'Investor',
                  sellerName: data.sellerName || '—',
                  sellerId: data.sellerId,
                  amount: data.amount || 0,
                  method: data.method || 'BANK',
                  status: data.status || 'PENDING',
                  accountDetails: data.accountDetails || '',
                  requestedAt: data.requestedAt?.toDate?.()?.toISOString?.() ?? data.requestedAt ?? new Date().toISOString(),
                  processedAt: data.processedAt?.toDate?.()?.toISOString?.() ?? data.processedAt,
                  notes: data.notes,
                }
              })
            : []

          const ads: Ad[] = adSnap
            ? adSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Ad)
            : []

          const logs: ActivityLog[] = logSnap
            ? logSnap.docs.map(d => {
                const data = d.data()
                return {
                  id: d.id,
                  type: data.violationType ? 'SECURITY' : (data.type || 'USER'),
                  action: data.violationLabel || data.action || 'Activity recorded',
                  actor: data.userName || data.actor || 'Unknown',
                  role: data.role || 'USER',
                  ip: data.ip || '—',
                  severity: data.violationType ? 'warning' : (data.severity || 'info'),
                  timestamp: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? new Date().toISOString(),
                }
              })
            : []

          const subscriptions: Subscription[] = subSnap
            ? subSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Subscription)
            : []

          const sellers: Seller[] = userSnap
            ? userSnap.docs.map(d => {
                const data = d.data()
                return {
                  id: d.id,
                  companyName: data.companyName || data.firstName + ' ' + data.lastName,
                  email: data.email || '',
                  phone: data.phone || '',
                  plan: data.plan || 'STARTER',
                  investors: data.investorCount || 0,
                  totalInvested: data.totalInvested || 0,
                  isApproved: data.isApproved ?? true,
                  isSuspended: data.isSuspended ?? false,
                  createdAt: data.createdAt || new Date().toISOString(),
                  owner: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                }
              })
            : []

          set({ withdrawals, ads, logs, subscriptions, sellers, isLoaded: true })
        } catch (e) {
          console.error('[AdminStore] initialize error:', e)
          set({ isLoaded: true })
        }
      },

      // ── Sellers ──────────────────────────────────────────────────────────
      approveSeller: (id) => {
        set((s) => ({
          sellers: s.sellers.map((sel) => sel.id === id ? { ...sel, isApproved: true, isSuspended: false } : sel),
        }))
      },
      suspendSeller: (id) => {
        set((s) => ({ sellers: s.sellers.map((sel) => sel.id === id ? { ...sel, isSuspended: true } : sel) }))
      },
      unsuspendSeller: (id) => {
        set((s) => ({ sellers: s.sellers.map((sel) => sel.id === id ? { ...sel, isSuspended: false } : sel) }))
      },
      deleteSeller: (id) => {
        set((s) => ({ sellers: s.sellers.filter((sel) => sel.id !== id) }))
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
      approveWithdrawal: async (id) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { doc, updateDoc } = await import('firebase/firestore')
          await updateDoc(doc(db, 'withdrawals', id), { status: 'APPROVED' })
          set((s) => ({ withdrawals: s.withdrawals.map((w) => w.id === id ? { ...w, status: 'APPROVED' as const } : w) }))
        } catch (e) { console.error('[AdminStore] approveWithdrawal error:', e); throw e }
      },
      rejectWithdrawal: async (id, notes) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { doc, updateDoc } = await import('firebase/firestore')
          await updateDoc(doc(db, 'withdrawals', id), { status: 'REJECTED', notes: notes || null })
          set((s) => ({ withdrawals: s.withdrawals.map((w) => w.id === id ? { ...w, status: 'REJECTED' as const, notes } : w) }))
        } catch (e) { console.error('[AdminStore] rejectWithdrawal error:', e); throw e }
      },
      markWithdrawalProcessing: async (id) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { doc, updateDoc } = await import('firebase/firestore')
          await updateDoc(doc(db, 'withdrawals', id), { status: 'PROCESSING' })
          set((s) => ({ withdrawals: s.withdrawals.map((w) => w.id === id ? { ...w, status: 'PROCESSING' as const } : w) }))
        } catch (e) { console.error('[AdminStore] markWithdrawalProcessing error:', e) }
      },
      markWithdrawalCompleted: async (id) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
          await updateDoc(doc(db, 'withdrawals', id), { status: 'COMPLETED', processedAt: serverTimestamp() })
          set((s) => ({
            withdrawals: s.withdrawals.map((w) => w.id === id ? { ...w, status: 'COMPLETED' as const, processedAt: new Date().toISOString() } : w),
          }))
        } catch (e) { console.error('[AdminStore] markWithdrawalCompleted error:', e); throw e }
      },

      // ── Ads ───────────────────────────────────────────────────────────────
      createAd: async (ad) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
          const ref = await addDoc(collection(db, 'ads'), {
            ...ad, impressions: 0, clicks: 0, createdAt: serverTimestamp(),
          })
          const newAd: Ad = { ...ad, id: ref.id, impressions: 0, clicks: 0, createdAt: new Date().toISOString() }
          set((s) => ({ ads: [newAd, ...s.ads] }))
        } catch (e) { console.error('[AdminStore] createAd error:', e); throw e }
      },
      toggleAdStatus: async (id) => {
        const ad = get().ads.find(a => a.id === id)
        if (!ad) return
        const newStatus = ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
        try {
          const { db } = await import('@/lib/firebase')
          const { doc, updateDoc } = await import('firebase/firestore')
          await updateDoc(doc(db, 'ads', id), { status: newStatus })
          set((s) => ({ ads: s.ads.map((a) => a.id === id ? { ...a, status: newStatus as any } : a) }))
        } catch (e) { console.error('[AdminStore] toggleAdStatus error:', e) }
      },
      deleteAd: async (id) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { doc, deleteDoc } = await import('firebase/firestore')
          await deleteDoc(doc(db, 'ads', id))
          set((s) => ({ ads: s.ads.filter((a) => a.id !== id) }))
        } catch (e) { console.error('[AdminStore] deleteAd error:', e) }
      },
      incrementAdImpression: (id) => {
        set((s) => ({ ads: s.ads.map((a) => a.id === id ? { ...a, impressions: a.impressions + 1 } : a) }))
      },
      incrementAdClick: (id) => {
        set((s) => ({ ads: s.ads.map((a) => a.id === id ? { ...a, clicks: a.clicks + 1 } : a) }))
      },

      // ── Logs ──────────────────────────────────────────────────────────────
      addLog: async (log) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
          const ref = await addDoc(collection(db, 'activity_logs'), {
            ...log, createdAt: serverTimestamp(),
          })
          const newLog: ActivityLog = { ...log, id: ref.id, timestamp: new Date().toISOString() }
          set((s) => ({ logs: [newLog, ...s.logs].slice(0, 500) }))
        } catch (e) {
          // Best-effort logging — don't throw
          const newLog: ActivityLog = { ...log, id: `log_${Date.now()}`, timestamp: new Date().toISOString() }
          set((s) => ({ logs: [newLog, ...s.logs].slice(0, 500) }))
        }
      },

      // ── Subscriptions ─────────────────────────────────────────────────────
      cancelSubscription: async (id) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { doc, updateDoc } = await import('firebase/firestore')
          await updateDoc(doc(db, 'subscriptions', id), { status: 'CANCELLED' })
          set((s) => ({ subscriptions: s.subscriptions.map((sub) => sub.id === id ? { ...sub, status: 'CANCELLED' as const } : sub) }))
        } catch (e) { console.error('[AdminStore] cancelSubscription error:', e); throw e }
      },
      updatePlan: async (id, plan) => {
        const prices: Record<string, number> = { STARTER: 49, GROWTH: 149, ENTERPRISE: 399 }
        try {
          const { db } = await import('@/lib/firebase')
          const { doc, updateDoc } = await import('firebase/firestore')
          await updateDoc(doc(db, 'subscriptions', id), { plan, amount: prices[plan] })
          set((s) => ({ subscriptions: s.subscriptions.map((sub) => sub.id === id ? { ...sub, plan, amount: prices[plan] } : sub) }))
        } catch (e) { console.error('[AdminStore] updatePlan error:', e); throw e }
      },
    }),
    {
      name: 'investor-panel-admin',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ads: state.ads,
      }),
    },
  ),
)
