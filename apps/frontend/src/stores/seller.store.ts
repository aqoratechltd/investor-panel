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
  isLoaded: boolean

  initialize: (userId: string, userName: string) => Promise<void>

  // Coins
  createCoin: (userId: string, coin: Omit<SellerCoin, 'id' | 'createdAt' | 'totalSupply' | 'currentPrice' | 'isActive'>) => Promise<void>
  updateCoin: (id: string, updates: Partial<SellerCoin>) => Promise<void>
  deleteCoin: (id: string) => Promise<void>
  toggleCoinActive: (id: string) => Promise<void>

  // Investors
  updateInvestorStatus: (id: string, status: SellerInvestor['status']) => void
  addCoinToInvestor: (investorId: string, amount: number) => void

  // Withdrawals
  approveWithdrawal: (id: string, investorId: string) => Promise<void>
  rejectWithdrawal: (id: string, notes?: string) => Promise<void>
  markWithdrawalCompleted: (id: string) => Promise<void>

  // Tasks
  createTask: (userId: string, task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>
  updateTaskStatus: (id: string, status: Task['status']) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>

  // Meetings
  createMeeting: (userId: string, meeting: Omit<Meeting, 'id' | 'createdAt'>) => Promise<void>
  completeMeeting: (id: string, notes?: string) => Promise<void>
  cancelMeeting: (id: string) => Promise<void>

  // Team messages
  sendMessage: (contactId: string, content: string, senderName: string) => void
  markContactRead: (contactId: string) => void
}

export const useSellerStore = create<SellerState>()(
  persist(
    (set, get) => ({
      coins: [],
      investors: [],
      withdrawals: [],
      tasks: [],
      meetings: [],
      contacts: [],
      messages: [],
      investments: [],
      isLoaded: false,

      // ── Initialize from Firestore ─────────────────────────────────────────
      initialize: async (userId, userName) => {
        if (!userId) return
        try {
          const { db } = await import('@/lib/firebase')
          const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore')

          const [
            invSnap, wdSnap, taskSnap, meetingSnap, coinSnap,
          ] = await Promise.all([
            // All investments where sellerId = this seller (gives investor list)
            getDocs(query(
              collection(db, 'investments'),
              where('sellerId', '==', userId),
              orderBy('createdAt', 'desc'),
            )).catch(() => null),
            // All withdrawals where sellerId = this seller
            getDocs(query(
              collection(db, 'withdrawals'),
              where('sellerId', '==', userId),
              orderBy('requestedAt', 'desc'),
            )).catch(() => null),
            // Tasks
            getDocs(query(
              collection(db, 'tasks'),
              where('sellerId', '==', userId),
              orderBy('createdAt', 'desc'),
            )).catch(() => null),
            // Meetings
            getDocs(query(
              collection(db, 'meetings'),
              where('sellerId', '==', userId),
              orderBy('date', 'desc'),
            )).catch(() => null),
            // Seller coins
            getDocs(query(
              collection(db, 'seller_coins'),
              where('sellerId', '==', userId),
            )).catch(() => null),
          ])

          // Build investor list from unique investorIds in investments
          const investorMap = new Map<string, SellerInvestor>()
          if (invSnap) {
            for (const d of invSnap.docs) {
              const data = d.data()
              const id = data.investorId
              if (!id) continue
              const existing = investorMap.get(id)
              const amount = data.amount || 0
              if (existing) {
                existing.totalInvested += amount
              } else {
                investorMap.set(id, {
                  id,
                  firstName: data.investorName?.split(' ')[0] || 'Investor',
                  lastName: data.investorName?.split(' ').slice(1).join(' ') || '',
                  email: data.investorEmail || '',
                  phone: '',
                  totalInvested: amount,
                  totalProfit: 0,
                  roi: data.expectedROI || 0,
                  coinBalance: 0,
                  status: 'ACTIVE',
                  joinedAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? new Date().toISOString(),
                  lastActivity: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
                })
              }
            }
          }

          const withdrawals: SellerWithdrawal[] = wdSnap
            ? wdSnap.docs.map(d => {
                const data = d.data()
                return {
                  id: d.id,
                  investorId: data.investorId || '',
                  investorName: data.investorName || 'Investor',
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

          const tasks: Task[] = taskSnap
            ? taskSnap.docs.map(d => {
                const data = d.data()
                return {
                  id: d.id,
                  title: data.title || '',
                  description: data.description || '',
                  priority: data.priority || 'MEDIUM',
                  status: data.status || 'TODO',
                  assignee: data.assignee || userName,
                  dueDate: data.dueDate || '',
                  tags: data.tags || [],
                  createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? new Date().toISOString(),
                }
              })
            : []

          const meetings: Meeting[] = meetingSnap
            ? meetingSnap.docs.map(d => {
                const data = d.data()
                return {
                  id: d.id,
                  title: data.title || '',
                  type: data.type || 'VIDEO',
                  attendees: data.attendees || [],
                  date: data.date?.toDate?.()?.toISOString?.() ?? data.date ?? '',
                  duration: data.duration || 30,
                  status: data.status || 'UPCOMING',
                  notes: data.notes,
                  link: data.link,
                  createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? new Date().toISOString(),
                }
              })
            : []

          const coins: SellerCoin[] = coinSnap
            ? coinSnap.docs.map(d => ({ id: d.id, ...d.data() }) as SellerCoin)
            : []

          set({
            investors: Array.from(investorMap.values()),
            withdrawals,
            tasks,
            meetings,
            coins,
            isLoaded: true,
          })
        } catch (e) {
          console.error('[SellerStore] initialize error:', e)
          set({ isLoaded: true })
        }
      },

      // ── Coins ────────────────────────────────────────────────────────────
      createCoin: async (userId, coin) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
          const ref = await addDoc(collection(db, 'seller_coins'), {
            ...coin,
            sellerId: userId,
            totalSupply: 1000000,
            currentPrice: 1.00,
            isActive: true,
            createdAt: serverTimestamp(),
          })
          const newCoin: SellerCoin = {
            ...coin,
            id: ref.id,
            totalSupply: 1000000,
            currentPrice: 1.00,
            isActive: true,
            createdAt: new Date().toISOString(),
          }
          set((s) => ({ coins: [newCoin, ...s.coins] }))
        } catch (e) { console.error('[SellerStore] createCoin error:', e); throw e }
      },

      updateCoin: async (id, updates) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { doc, updateDoc } = await import('firebase/firestore')
          await updateDoc(doc(db, 'seller_coins', id), updates as any)
          set((s) => ({ coins: s.coins.map((c) => c.id === id ? { ...c, ...updates } : c) }))
        } catch (e) { console.error('[SellerStore] updateCoin error:', e); throw e }
      },

      deleteCoin: async (id) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { doc, deleteDoc } = await import('firebase/firestore')
          await deleteDoc(doc(db, 'seller_coins', id))
          set((s) => ({ coins: s.coins.filter((c) => c.id !== id) }))
        } catch (e) { console.error('[SellerStore] deleteCoin error:', e); throw e }
      },

      toggleCoinActive: async (id) => {
        const coin = get().coins.find(c => c.id === id)
        if (!coin) return
        try {
          const { db } = await import('@/lib/firebase')
          const { doc, updateDoc } = await import('firebase/firestore')
          await updateDoc(doc(db, 'seller_coins', id), { isActive: !coin.isActive })
          set((s) => ({ coins: s.coins.map((c) => c.id === id ? { ...c, isActive: !c.isActive } : c) }))
        } catch (e) { console.error('[SellerStore] toggleCoinActive error:', e); throw e }
      },

      // ── Investors ────────────────────────────────────────────────────────
      updateInvestorStatus: (id, status) => {
        set((s) => ({ investors: s.investors.map((inv) => inv.id === id ? { ...inv, status } : inv) }))
      },
      addCoinToInvestor: (investorId, amount) => {
        set((s) => ({ investors: s.investors.map((inv) => inv.id === investorId ? { ...inv, coinBalance: inv.coinBalance + amount } : inv) }))
      },

      // ── Withdrawals ───────────────────────────────────────────────────────
      approveWithdrawal: async (id, investorId) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { doc, updateDoc, setDoc, increment } = await import('firebase/firestore')
          await updateDoc(doc(db, 'withdrawals', id), { status: 'APPROVED' })
          // Credit available balance back to investor (they can now re-withdraw or it flows to completed)
          set((s) => ({ withdrawals: s.withdrawals.map((w) => w.id === id ? { ...w, status: 'APPROVED' as const } : w) }))
        } catch (e) { console.error('[SellerStore] approveWithdrawal error:', e); throw e }
      },

      rejectWithdrawal: async (id, notes) => {
        const w = get().withdrawals.find(w => w.id === id)
        if (!w) return
        try {
          const { db } = await import('@/lib/firebase')
          const { doc, updateDoc, setDoc, increment } = await import('firebase/firestore')
          await updateDoc(doc(db, 'withdrawals', id), { status: 'REJECTED', notes: notes || null })
          // Refund balance to investor
          if (w.investorId) {
            await setDoc(doc(db, 'user_flags', w.investorId), {
              availableBalance: increment(w.amount),
            }, { merge: true })
          }
          set((s) => ({ withdrawals: s.withdrawals.map((wd) => wd.id === id ? { ...wd, status: 'REJECTED' as const, notes } : wd) }))
        } catch (e) { console.error('[SellerStore] rejectWithdrawal error:', e); throw e }
      },

      markWithdrawalCompleted: async (id) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
          await updateDoc(doc(db, 'withdrawals', id), { status: 'COMPLETED', processedAt: serverTimestamp() })
          set((s) => ({ withdrawals: s.withdrawals.map((w) => w.id === id ? { ...w, status: 'COMPLETED' as const, processedAt: new Date().toISOString() } : w) }))
        } catch (e) { console.error('[SellerStore] markWithdrawalCompleted error:', e); throw e }
      },

      // ── Tasks ─────────────────────────────────────────────────────────────
      createTask: async (userId, task) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
          const ref = await addDoc(collection(db, 'tasks'), {
            ...task, sellerId: userId, createdAt: serverTimestamp(),
          })
          const newTask: Task = { ...task, id: ref.id, createdAt: new Date().toISOString() }
          set((s) => ({ tasks: [newTask, ...s.tasks] }))
        } catch (e) { console.error('[SellerStore] createTask error:', e); throw e }
      },

      updateTaskStatus: async (id, status) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { doc, updateDoc } = await import('firebase/firestore')
          await updateDoc(doc(db, 'tasks', id), { status })
          set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, status } : t) }))
        } catch (e) { console.error('[SellerStore] updateTaskStatus error:', e) }
      },

      deleteTask: async (id) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { doc, deleteDoc } = await import('firebase/firestore')
          await deleteDoc(doc(db, 'tasks', id))
          set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
        } catch (e) { console.error('[SellerStore] deleteTask error:', e) }
      },

      updateTask: async (id, updates) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { doc, updateDoc } = await import('firebase/firestore')
          await updateDoc(doc(db, 'tasks', id), updates as any)
          set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates } : t) }))
        } catch (e) { console.error('[SellerStore] updateTask error:', e) }
      },

      // ── Meetings ──────────────────────────────────────────────────────────
      createMeeting: async (userId, meeting) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
          const ref = await addDoc(collection(db, 'meetings'), {
            ...meeting, sellerId: userId, createdAt: serverTimestamp(),
          })
          const newMeeting: Meeting = { ...meeting, id: ref.id, createdAt: new Date().toISOString() }
          set((s) => ({ meetings: [newMeeting, ...s.meetings] }))
        } catch (e) { console.error('[SellerStore] createMeeting error:', e); throw e }
      },

      completeMeeting: async (id, notes) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { doc, updateDoc } = await import('firebase/firestore')
          await updateDoc(doc(db, 'meetings', id), { status: 'COMPLETED', notes: notes || null })
          set((s) => ({ meetings: s.meetings.map((m) => m.id === id ? { ...m, status: 'COMPLETED' as const, notes: notes || m.notes } : m) }))
        } catch (e) { console.error('[SellerStore] completeMeeting error:', e) }
      },

      cancelMeeting: async (id) => {
        try {
          const { db } = await import('@/lib/firebase')
          const { doc, updateDoc } = await import('firebase/firestore')
          await updateDoc(doc(db, 'meetings', id), { status: 'CANCELLED' })
          set((s) => ({ meetings: s.meetings.map((m) => m.id === id ? { ...m, status: 'CANCELLED' as const } : m) }))
        } catch (e) { console.error('[SellerStore] cancelMeeting error:', e) }
      },

      // ── Team messages (local-only, backed by chats collection via inbox) ──
      sendMessage: (contactId, content, senderName) => {
        const newMsg: TeamMessage = {
          id: `msg_${Date.now()}`,
          contactId,
          senderId: 'seller',
          senderName,
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
      partialize: (state) => ({
        // Only persist lightweight UI state
        coins: state.coins,
      }),
    },
  ),
)
