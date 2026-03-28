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

  setFilter: (f: Partial<MarketplaceFilter>) => void
  setSelectedAsset: (a: MarketAsset | null) => void
  submitInquiry: (inquiry: Omit<Inquiry, 'id' | 'status' | 'createdAt'>) => void
  approveInquiry: (id: string) => void
  rejectInquiry: (id: string) => void
  sendMessage: (
    leadId: string,
    senderId: string,
    senderName: string,
    role: 'SELLER' | 'INVESTOR',
    content: string,
  ) => void
  toggleTopPerforming: (assetId: string) => void
  recalculateScores: () => void
  updateAssetPrice: (assetId: string, newPrice: number) => void
}

// ── Price history generator ─────────────────────────────────
function generatePriceHistory(basePrice: number, days = 30): Array<{ date: string; value: number }> {
  const history: Array<{ date: string; value: number }> = []
  let price = basePrice * 0.85
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    price = price * (1 + (Math.random() - 0.45) * 0.04)
    history.push({
      date: date.toISOString().split('T')[0],
      value: Math.max(price, basePrice * 0.5),
    })
  }
  return history
}

// ── Performance score formula ───────────────────────────────
function calcScore(returnRate: number, volume: number): number {
  return Math.round(returnRate * Math.sqrt(volume / 1000) * 10) / 10
}

// ── Seed assets ─────────────────────────────────────────────
const SEED_ASSETS: Omit<MarketAsset, 'performanceScore' | 'isTopPerforming'>[] = [
  {
    id: 'asset_001',
    type: 'COIN',
    name: 'MetaGrowth Token',
    symbol: 'MGT',
    sellerId: 'user_seller',
    sellerName: 'Demo Seller',
    sellerCompany: 'NovaTech Capital',
    description:
      'A high-yield digital token backed by Meta advertising revenue streams. Generates consistent monthly returns through programmatic ad auctions.',
    returnRate: 18.4,
    volume: 2_400_000,
    isTopPerformingManual: false,
    currentPrice: 4.82,
    priceHistory: generatePriceHistory(4.82),
    iconColor: '#1877F2',
    category: 'Digital Advertising',
    minInvestment: 500,
    totalInvestors: 312,
    riskLevel: 'MEDIUM',
  },
  {
    id: 'asset_002',
    type: 'COMPANY',
    name: 'AlphaScale Ventures',
    symbol: 'ASV',
    sellerId: 'user_seller',
    sellerName: 'Demo Seller',
    sellerCompany: 'NovaTech Capital',
    description:
      'Growth-stage fintech company specializing in SME lending and embedded finance. Strong Q3 performance with 34% YoY revenue growth.',
    returnRate: 24.1,
    volume: 5_800_000,
    isTopPerformingManual: false,
    currentPrice: 128.5,
    priceHistory: generatePriceHistory(128.5),
    iconColor: '#06b6d4',
    category: 'FinTech',
    minInvestment: 5000,
    totalInvestors: 87,
    riskLevel: 'HIGH',
  },
  {
    id: 'asset_003',
    type: 'COIN',
    name: 'StableYield Coin',
    symbol: 'SYC',
    sellerId: 'seller_02',
    sellerName: 'Aria Khan',
    sellerCompany: 'BluePeak Investments',
    description:
      'Low-volatility stablecoin strategy that captures yield from DeFi liquidity pools. Designed for conservative investors seeking predictable returns.',
    returnRate: 8.6,
    volume: 9_200_000,
    isTopPerformingManual: false,
    currentPrice: 1.08,
    priceHistory: generatePriceHistory(1.08),
    iconColor: '#10b981',
    category: 'Stable Yield',
    minInvestment: 200,
    totalInvestors: 1024,
    riskLevel: 'LOW',
  },
  {
    id: 'asset_004',
    type: 'COMPANY',
    name: 'Quantum Logistics Ltd',
    symbol: 'QLL',
    sellerId: 'seller_03',
    sellerName: 'James Okafor',
    sellerCompany: 'Meridian Growth Fund',
    description:
      'AI-powered supply chain and last-mile delivery platform operating across 12 emerging markets. Recently secured $40M Series B.',
    returnRate: 31.7,
    volume: 3_100_000,
    isTopPerformingManual: false,
    currentPrice: 52.3,
    priceHistory: generatePriceHistory(52.3),
    iconColor: '#f59e0b',
    category: 'Logistics & AI',
    minInvestment: 2000,
    totalInvestors: 156,
    riskLevel: 'HIGH',
  },
  {
    id: 'asset_005',
    type: 'COIN',
    name: 'TikTok Ads Pool',
    symbol: 'TAP',
    sellerId: 'user_seller',
    sellerName: 'Demo Seller',
    sellerCompany: 'NovaTech Capital',
    description:
      'Pooled investment vehicle linked to TikTok advertising performance metrics. Returns distributed weekly based on CPC optimization.',
    returnRate: 14.9,
    volume: 1_850_000,
    isTopPerformingManual: false,
    currentPrice: 2.37,
    priceHistory: generatePriceHistory(2.37),
    iconColor: '#FF0050',
    category: 'Social Media Ads',
    minInvestment: 300,
    totalInvestors: 445,
    riskLevel: 'MEDIUM',
  },
  {
    id: 'asset_006',
    type: 'COMPANY',
    name: 'GreenVolt Energy',
    symbol: 'GVE',
    sellerId: 'seller_04',
    sellerName: 'Sofia Mendez',
    sellerCompany: 'Apex Capital Partners',
    description:
      'Renewable energy infrastructure company deploying solar micro-grids in Southeast Asia. Government-backed projects with guaranteed offtake.',
    returnRate: 19.8,
    volume: 7_400_000,
    isTopPerformingManual: false,
    currentPrice: 84.1,
    priceHistory: generatePriceHistory(84.1),
    iconColor: '#22c55e',
    category: 'Clean Energy',
    minInvestment: 3000,
    totalInvestors: 203,
    riskLevel: 'LOW',
  },
  {
    id: 'asset_007',
    type: 'COIN',
    name: 'DataStream Token',
    symbol: 'DST',
    sellerId: 'seller_02',
    sellerName: 'Aria Khan',
    sellerCompany: 'BluePeak Investments',
    description:
      'Utility token that monetizes anonymized consumer data insights across 200+ partner retailers. Monthly dividend in USDC.',
    returnRate: 22.3,
    volume: 4_600_000,
    isTopPerformingManual: false,
    currentPrice: 6.94,
    priceHistory: generatePriceHistory(6.94),
    iconColor: '#8b5cf6',
    category: 'Data Commerce',
    minInvestment: 750,
    totalInvestors: 678,
    riskLevel: 'MEDIUM',
  },
  {
    id: 'asset_008',
    type: 'COMPANY',
    name: 'PharmaLink Diagnostics',
    symbol: 'PLD',
    sellerId: 'seller_03',
    sellerName: 'James Okafor',
    sellerCompany: 'Meridian Growth Fund',
    description:
      'Point-of-care diagnostics company with FDA-cleared rapid test portfolio. Expanding into telehealth with 58% gross margins.',
    returnRate: 27.6,
    volume: 2_950_000,
    isTopPerformingManual: false,
    currentPrice: 41.7,
    priceHistory: generatePriceHistory(41.7),
    iconColor: '#ec4899',
    category: 'HealthTech',
    minInvestment: 4000,
    totalInvestors: 94,
    riskLevel: 'HIGH',
  },
]

// ── Compute scores and top-3 ────────────────────────────────
function computeTopPerforming(
  assets: Omit<MarketAsset, 'performanceScore' | 'isTopPerforming'>[],
): MarketAsset[] {
  const scored = assets.map((a) => ({
    ...a,
    performanceScore: calcScore(a.returnRate, a.volume),
    isTopPerforming: false,
  }))

  // Find top 3 by score (only among non-manually-pinned, but still mark them)
  const sorted = [...scored].sort((a, b) => b.performanceScore - a.performanceScore)
  const top3Ids = new Set(sorted.slice(0, 3).map((a) => a.id))

  return scored.map((a) => ({
    ...a,
    isTopPerforming: a.isTopPerformingManual || top3Ids.has(a.id),
  }))
}

// ── Seed inquiries ──────────────────────────────────────────
const SEED_INQUIRIES: Inquiry[] = [
  {
    id: 'inq_001',
    assetId: 'asset_002',
    assetName: 'AlphaScale Ventures',
    assetType: 'COMPANY',
    sellerId: 'user_seller',
    sellerName: 'Demo Seller',
    investorId: 'user_investor',
    investorName: 'Demo Investor',
    phone: '+1 (555) 234-5678',
    email: 'investor@demo.io',
    investmentThesis:
      'I believe AlphaScale Ventures is positioned to capitalize on the growing SME lending gap in emerging markets. My thesis is based on the 34% YoY revenue growth and the expanding fintech regulatory framework. I have extensively researched embedded finance trends and see this as a multi-year compounding opportunity with strong downside protection from the lending book quality.',
    portfolioHistory:
      'Previously invested in two fintech unicorns (Series A and B rounds), returned 3.2x and 2.8x respectively. Active positions in three SaaS companies and one logistics platform. Total portfolio under management: $2.4M.',
    requestedAmount: 50000,
    status: 'PENDING',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inq_002',
    assetId: 'asset_004',
    assetName: 'Quantum Logistics Ltd',
    assetType: 'COMPANY',
    sellerId: 'user_seller',
    sellerName: 'Demo Seller',
    investorId: 'investor_002',
    investorName: 'Rachel Torres',
    phone: '+44 7700 900123',
    email: 'r.torres@ventures.io',
    investmentThesis:
      'Supply chain AI is the defining infrastructure play of this decade. Quantum Logistics has first-mover advantage in 12 high-growth markets with significant barriers to entry. The recent Series B at a $180M valuation is attractive relative to comparable public comps trading at 8-12x revenue.',
    portfolioHistory:
      'Angel investor with 6 exits. Portfolio includes logistics SaaS, last-mile delivery in MENA, and warehouse automation. Combined IRR of 31% over past 5 years. Conservative allocation strategy — never more than 15% in any single sector.',
    requestedAmount: 120000,
    status: 'PENDING',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
]

// ── Seed chat messages ──────────────────────────────────────
const SEED_MESSAGES: Record<string, ChatMessage[]> = {
  inq_001: [
    {
      id: 'msg_001',
      leadId: 'inq_001',
      senderId: 'user_investor',
      senderName: 'Demo Investor',
      senderRole: 'INVESTOR',
      content:
        'Hi! I just submitted my inquiry for AlphaScale Ventures. I am very excited about this opportunity and would love to discuss further.',
      timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg_002',
      leadId: 'inq_001',
      senderId: 'user_seller',
      senderName: 'Demo Seller',
      senderRole: 'SELLER',
      content:
        'Welcome! I have reviewed your inquiry and your background is impressive. The 34% YoY growth you mentioned is indeed a strong signal. Can you tell me more about your risk tolerance and investment horizon?',
      timestamp: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg_003',
      leadId: 'inq_001',
      senderId: 'user_investor',
      senderName: 'Demo Investor',
      senderRole: 'INVESTOR',
      content:
        'I am looking at a 3–5 year horizon. I prefer a balanced approach — not overly aggressive, but willing to accept medium-high risk for strong returns. My target IRR is 20%+.',
      timestamp: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg_004',
      leadId: 'inq_001',
      senderId: 'user_seller',
      senderName: 'Demo Seller',
      senderRole: 'SELLER',
      content:
        'That aligns perfectly with our projections. I will send over the full data room including audited financials and cap table. We expect to close this round within 3 weeks.',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
  ],
  inq_002: [
    {
      id: 'msg_005',
      leadId: 'inq_002',
      senderId: 'investor_002',
      senderName: 'Rachel Torres',
      senderRole: 'INVESTOR',
      content:
        'I would like to understand the unit economics better. What is the customer acquisition cost vs. lifetime value ratio across your target markets?',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg_006',
      leadId: 'inq_002',
      senderId: 'user_seller',
      senderName: 'Demo Seller',
      senderRole: 'SELLER',
      content:
        'Great question. Our LTV:CAC ratio is 4.8x on average, ranging from 3.2x in newer markets to 7.1x in established corridors. I can share the full breakdown by geography.',
      timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg_007',
      leadId: 'inq_002',
      senderId: 'investor_002',
      senderName: 'Rachel Torres',
      senderRole: 'INVESTOR',
      content:
        'Those numbers look strong. My allocation would be structured as 60% equity, 40% convertible note. Is that structure acceptable?',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
  ],
}

// ── Store ───────────────────────────────────────────────────
export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  assets: computeTopPerforming(SEED_ASSETS),
  inquiries: SEED_INQUIRIES,
  chatMessages: SEED_MESSAGES,
  selectedAsset: null,
  filter: {
    type: 'ALL',
    risk: 'ALL',
    minReturn: 0,
    sort: 'performanceScore',
  },

  setFilter: (f) =>
    set((state) => ({ filter: { ...state.filter, ...f } })),

  setSelectedAsset: (a) => set({ selectedAsset: a }),

  submitInquiry: (inquiry) => {
    const newInquiry: Inquiry = {
      ...inquiry,
      id: `inq_${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ inquiries: [...state.inquiries, newInquiry] }))
  },

  approveInquiry: (id) =>
    set((state) => ({
      inquiries: state.inquiries.map((inq) =>
        inq.id === id ? { ...inq, status: 'APPROVED' } : inq,
      ),
    })),

  rejectInquiry: (id) =>
    set((state) => ({
      inquiries: state.inquiries.map((inq) =>
        inq.id === id ? { ...inq, status: 'REJECTED' } : inq,
      ),
    })),

  sendMessage: (leadId, senderId, senderName, role, content) => {
    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      leadId,
      senderId,
      senderName,
      senderRole: role,
      content,
      timestamp: new Date().toISOString(),
    }
    set((state) => ({
      chatMessages: {
        ...state.chatMessages,
        [leadId]: [...(state.chatMessages[leadId] || []), message],
      },
    }))
  },

  toggleTopPerforming: (assetId) => {
    set((state) => {
      const assets = state.assets.map((a) =>
        a.id === assetId ? { ...a, isTopPerformingManual: !a.isTopPerformingManual } : a,
      )
      return { assets: recomputeTop(assets) }
    })
  },

  recalculateScores: () => {
    set((state) => {
      const assets = state.assets.map((a) => ({
        ...a,
        performanceScore: calcScore(a.returnRate, a.volume),
      }))
      return { assets: recomputeTop(assets) }
    })
  },

  updateAssetPrice: (assetId, newPrice) => {
    set((state) => ({
      assets: state.assets.map((a) => {
        if (a.id !== assetId) return a
        const newEntry = { date: new Date().toISOString().split('T')[0], value: newPrice }
        return {
          ...a,
          currentPrice: newPrice,
          priceHistory: [...a.priceHistory, newEntry].slice(-60),
        }
      }),
    }))
  },
}))

// ── Helper to recompute top-performing after manual overrides ─
function recomputeTop(assets: MarketAsset[]): MarketAsset[] {
  const sorted = [...assets].sort((a, b) => b.performanceScore - a.performanceScore)
  const top3Ids = new Set(sorted.slice(0, 3).map((a) => a.id))
  return assets.map((a) => ({
    ...a,
    isTopPerforming: a.isTopPerformingManual || top3Ids.has(a.id),
  }))
}
