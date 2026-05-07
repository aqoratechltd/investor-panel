import { create } from 'zustand'

export interface MarketAsset {
  id: string
  type: 'COIN' | 'COMPANY'
  name: string
  symbol: string
  sellerId: string
  sellerName: string
  sellerCompany: string
  description: string
  returnRate: number
  volume: number
  performanceScore: number
  isTopPerforming: boolean
  isTopPerformingManual: boolean
  currentPrice: number
  priceHistory: Array<{ date: string; value: number }>
  iconColor: string
  category: string
  minInvestment: number
  totalInvestors: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface Inquiry {
  id: string
  assetId: string
  assetName: string
  assetType: string
  sellerId: string
  sellerName: string
  investorId: string
  investorName: string
  phone: string
  email: string
  investmentThesis: string
  portfolioHistory: string
  requestedAmount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

export interface ChatMessage {
  id: string
  leadId: string
  senderId: string
  senderName: string
  senderRole: 'SELLER' | 'INVESTOR'
  content: string
  timestamp: string
}

interface MarketplaceFilter {
  type: 'ALL' | 'COIN' | 'COMPANY'
  risk: string
  minReturn: number
  sort: string
}

interface MarketplaceState {
  assets: MarketAsset[]
  inquiries: Inquiry[]
  chatMessages: Record<string, ChatMessage[]>
  selectedAsset: MarketAsset | null
  filter: MarketplaceFilter
  isLoaded: boolean

  initialize: () => Promise<void>
  setFilter: (f: Partial<MarketplaceFilter>) => void
  setSelectedAsset: (a: MarketAsset | null) => void
  submitInquiry: (inquiry: Omit<Inquiry, 'id' | 'status' | 'createdAt'>) => Promise<void>
  approveInquiry: (id: string) => Promise<void>
  rejectInquiry: (id: string) => Promise<void>
  sendMessage: (leadId: string, senderId: string, senderName: string, role: 'SELLER' | 'INVESTOR', content: string) => void
  toggleTopPerforming: (assetId: string) => void
  recalculateScores: () => void
  updateAssetPrice: (assetId: string, newPrice: number) => void
}

// ── Price history generator (kept for chart functionality) ───
// generatePriceHistory uses Math.random() intentionally — it generates
// realistic-looking sparkline history for the trading view charts.
function generatePriceHistory(basePrice: number, days = 30): Array<{ date: string; value: number }> {
  const history: Array<{ date: string; value: number }> = []
  let price = basePrice * 0.85
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    price = price * (1 + (Math.random() - 0.45) * 0.04)
    history.push({ date: date.toISOString().split('T')[0], value: Math.max(price, basePrice * 0.5) })
  }
  return history
}

function calcScore(returnRate: number, volume: number): number {
  return Math.round(returnRate * Math.sqrt(volume / 1000) * 10) / 10
}

function computeTopPerforming(assets: Omit<MarketAsset, 'performanceScore' | 'isTopPerforming'>[]): MarketAsset[] {
  const scored = assets.map((a) => ({
    ...a,
    performanceScore: calcScore(a.returnRate, a.volume),
    isTopPerforming: false,
  }))
  const sorted = [...scored].sort((a, b) => b.performanceScore - a.performanceScore)
  const top3Ids = new Set(sorted.slice(0, 3).map((a) => a.id))
  return scored.map((a) => ({ ...a, isTopPerforming: a.isTopPerformingManual || top3Ids.has(a.id) }))
}

function recomputeTop(assets: MarketAsset[]): MarketAsset[] {
  const sorted = [...assets].sort((a, b) => b.performanceScore - a.performanceScore)
  const top3Ids = new Set(sorted.slice(0, 3).map((a) => a.id))
  return assets.map((a) => ({ ...a, isTopPerforming: a.isTopPerformingManual || top3Ids.has(a.id) }))
}

// ── Store ────────────────────────────────────────────────────
export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  assets: [],
  inquiries: [],
  chatMessages: {},
  selectedAsset: null,
  isLoaded: false,
  filter: { type: 'ALL', risk: 'ALL', minReturn: 0, sort: 'performanceScore' },

  // Loads real assets from Firestore: published businesses → COMPANY, active coins → COIN
  initialize: async () => {
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, query, where, getDocs } = await import('firebase/firestore')

      const [bizSnap, coinSnap, inquirySnap] = await Promise.all([
        getDocs(query(collection(db, 'businesses'), where('status', '==', 'PUBLISHED'))).catch(() => null),
        getDocs(query(collection(db, 'seller_coins'), where('isActive', '==', true))).catch(() => null),
        getDocs(query(collection(db, 'marketplace_inquiries'))).catch(() => null),
      ])

      const assets: Omit<MarketAsset, 'performanceScore' | 'isTopPerforming'>[] = []

      if (bizSnap) {
        bizSnap.docs.forEach(d => {
          const b = d.data()
          assets.push({
            id: d.id,
            type: 'COMPANY',
            name: b.name || 'Business',
            symbol: (b.name || 'BIZ').replace(/[^A-Z]/gi, '').toUpperCase().slice(0, 4) || 'BIZ',
            sellerId: b.sellerId || '',
            sellerName: b.sellerName || '',
            sellerCompany: b.companyName || b.sellerName || '',
            description: b.description || '',
            returnRate: b.expectedROI || 0,
            volume: b.askingAmount || 0,
            isTopPerformingManual: false,
            currentPrice: b.minInvestment || 100,
            priceHistory: generatePriceHistory(b.minInvestment || 100),
            iconColor: '#06b6d4',
            category: b.category || b.industry || 'Other',
            minInvestment: b.minInvestment || 100,
            totalInvestors: b.interestedCount || 0,
            riskLevel: (['LOW', 'MEDIUM', 'HIGH'].includes(b.riskLevel?.toUpperCase()) ? b.riskLevel.toUpperCase() : 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
          })
        })
      }

      if (coinSnap) {
        coinSnap.docs.forEach(d => {
          const c = d.data()
          assets.push({
            id: d.id,
            type: 'COIN',
            name: c.name || 'Coin',
            symbol: c.symbol || 'COIN',
            sellerId: c.sellerId || '',
            sellerName: c.sellerName || '',
            sellerCompany: c.companyName || '',
            description: c.description || '',
            returnRate: c.returnRate || 0,
            volume: (c.totalSupply || 0) * (c.currentPrice || 1),
            isTopPerformingManual: false,
            currentPrice: c.currentPrice || 1,
            priceHistory: generatePriceHistory(c.currentPrice || 1),
            iconColor: '#f59e0b',
            category: 'Digital Token',
            minInvestment: 100,
            totalInvestors: 0,
            riskLevel: c.isPositive !== false ? 'LOW' : 'HIGH',
          })
        })
      }

      const inquiries: Inquiry[] = inquirySnap
        ? inquirySnap.docs.map(d => {
            const data = d.data()
            return {
              id: d.id,
              assetId: data.assetId || '',
              assetName: data.assetName || '',
              assetType: data.assetType || 'COMPANY',
              sellerId: data.sellerId || '',
              sellerName: data.sellerName || '',
              investorId: data.investorId || '',
              investorName: data.investorName || '',
              phone: data.phone || '',
              email: data.email || '',
              investmentThesis: data.investmentThesis || '',
              portfolioHistory: data.portfolioHistory || '',
              requestedAmount: data.requestedAmount || 0,
              status: data.status || 'PENDING',
              createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? new Date().toISOString(),
            }
          })
        : []

      set({ assets: computeTopPerforming(assets), inquiries, isLoaded: true })
    } catch (e) {
      console.error('[MarketplaceStore] initialize error:', e)
      set({ isLoaded: true })
    }
  },

  setFilter: (f) => set((state) => ({ filter: { ...state.filter, ...f } })),
  setSelectedAsset: (a) => set({ selectedAsset: a }),

  submitInquiry: async (inquiry) => {
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
      const ref = await addDoc(collection(db, 'marketplace_inquiries'), {
        ...inquiry, status: 'PENDING', createdAt: serverTimestamp(),
      })
      const newInquiry: Inquiry = { ...inquiry, id: ref.id, status: 'PENDING', createdAt: new Date().toISOString() }
      set((state) => ({ inquiries: [...state.inquiries, newInquiry] }))
    } catch (e) { console.error('[MarketplaceStore] submitInquiry error:', e) }
  },

  approveInquiry: async (id) => {
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc } = await import('firebase/firestore')
      await updateDoc(doc(db, 'marketplace_inquiries', id), { status: 'APPROVED' })
      set((state) => ({ inquiries: state.inquiries.map((inq) => inq.id === id ? { ...inq, status: 'APPROVED' } : inq) }))
    } catch (e) { console.error('[MarketplaceStore] approveInquiry error:', e) }
  },

  rejectInquiry: async (id) => {
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc } = await import('firebase/firestore')
      await updateDoc(doc(db, 'marketplace_inquiries', id), { status: 'REJECTED' })
      set((state) => ({ inquiries: state.inquiries.map((inq) => inq.id === id ? { ...inq, status: 'REJECTED' } : inq) }))
    } catch (e) { console.error('[MarketplaceStore] rejectInquiry error:', e) }
  },

  sendMessage: (leadId, senderId, senderName, role, content) => {
    const message: ChatMessage = {
      id: `msg_${Date.now()}`, leadId, senderId, senderName,
      senderRole: role, content, timestamp: new Date().toISOString(),
    }
    set((state) => ({
      chatMessages: { ...state.chatMessages, [leadId]: [...(state.chatMessages[leadId] || []), message] },
    }))
  },

  toggleTopPerforming: (assetId) => {
    set((state) => {
      const assets = state.assets.map((a) => a.id === assetId ? { ...a, isTopPerformingManual: !a.isTopPerformingManual } : a)
      return { assets: recomputeTop(assets) }
    })
  },

  recalculateScores: () => {
    set((state) => {
      const assets = state.assets.map((a) => ({ ...a, performanceScore: calcScore(a.returnRate, a.volume) }))
      return { assets: recomputeTop(assets) }
    })
  },

  updateAssetPrice: (assetId, newPrice) => {
    set((state) => ({
      assets: state.assets.map((a) => {
        if (a.id !== assetId) return a
        const newEntry = { date: new Date().toISOString().split('T')[0], value: newPrice }
        return { ...a, currentPrice: newPrice, priceHistory: [...a.priceHistory, newEntry].slice(-60) }
      }),
    }))
  },
}))
