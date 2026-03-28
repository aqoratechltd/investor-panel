import { create } from 'zustand'

export interface PortfolioAsset {
  assetId: string
  assetName: string
  assetSymbol: string
  amount: number
  allocation: number
  currentValue: number
  profitLoss: number
  profitPercent: number
  driftPercent: number
  driftDirection: 'UP' | 'DOWN' | 'NONE'
  priceHistory: Array<{ date: string; value: number }>
}

export interface Portfolio {
  id: string
  sellerId: string
  investorId: string
  investorName: string
  assets: PortfolioAsset[]
  totalInvested: number
  currentValue: number
  lastUpdated: string
  status: 'ACTIVE' | 'DRAFT'
}

export interface AISuggestion {
  suggestedAmount: number
  allocations: Array<{
    assetId: string
    assetName: string
    percent: number
    reasoning: string
  }>
  overallReasoning: string
  confidenceScore: number
  basedOnMessages: number
}

interface DriftEvent {
  assetId: string
  assetName: string
  direction: 'UP' | 'DOWN'
  percent: number
  timestamp: string
  affectedPortfolios: number
}

interface PortfolioState {
  portfolios: Portfolio[]
  aiSuggestion: AISuggestion | null
  isGeneratingAI: boolean
  driftEvents: DriftEvent[]
  isSimulating: boolean

  createPortfolio: (portfolio: Omit<Portfolio, 'id' | 'lastUpdated'>) => void
  updatePortfolio: (id: string, updates: Partial<Portfolio>) => void
  generateAISuggestion: (chatHistory: string[], investorProfile: string, context?: { selectedAssets?: any[]; investorName?: string; requestedAmount?: number }) => Promise<void>
  applyMarketDrift: (
    assetId: string,
    assetName: string,
    direction: 'UP' | 'DOWN',
    percent: number,
  ) => void
  startVolatilitySimulation: (
    assetId: string,
    basePercent: number,
    direction: 'UP' | 'DOWN',
  ) => () => void
  getInvestorPortfolio: (investorId: string) => Portfolio | undefined
}

// ── Price history helpers ────────────────────────────────────
function genHistory(baseValue: number, days = 30): Array<{ date: string; value: number }> {
  const history: Array<{ date: string; value: number }> = []
  let val = baseValue * 0.88
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    val = val * (1 + (Math.random() - 0.44) * 0.035)
    history.push({ date: date.toISOString().split('T')[0], value: Math.round(val * 100) / 100 })
  }
  return history
}

// ── Seed portfolios ──────────────────────────────────────────
const SEED_PORTFOLIOS: Portfolio[] = [
  {
    id: 'portfolio_001',
    sellerId: 'user_seller',
    investorId: 'user_investor',
    investorName: 'Demo Investor',
    totalInvested: 248500,
    currentValue: 281340,
    lastUpdated: new Date().toISOString(),
    status: 'ACTIVE',
    assets: [
      {
        assetId: 'asset_002',
        assetName: 'AlphaScale Ventures',
        assetSymbol: 'ASV',
        amount: 100000,
        allocation: 40.2,
        currentValue: 113200,
        profitLoss: 13200,
        profitPercent: 13.2,
        driftPercent: 0,
        driftDirection: 'NONE',
        priceHistory: genHistory(113200),
      },
      {
        assetId: 'asset_003',
        assetName: 'StableYield Coin',
        assetSymbol: 'SYC',
        amount: 60000,
        allocation: 24.1,
        currentValue: 65400,
        profitLoss: 5400,
        profitPercent: 9.0,
        driftPercent: 0,
        driftDirection: 'NONE',
        priceHistory: genHistory(65400),
      },
      {
        assetId: 'asset_001',
        assetName: 'MetaGrowth Token',
        assetSymbol: 'MGT',
        amount: 50000,
        allocation: 20.1,
        currentValue: 51800,
        profitLoss: 1800,
        profitPercent: 3.6,
        driftPercent: 0,
        driftDirection: 'NONE',
        priceHistory: genHistory(51800),
      },
      {
        assetId: 'asset_006',
        assetName: 'GreenVolt Energy',
        assetSymbol: 'GVE',
        amount: 25000,
        allocation: 10.1,
        currentValue: 27800,
        profitLoss: 2800,
        profitPercent: 11.2,
        driftPercent: 0,
        driftDirection: 'NONE',
        priceHistory: genHistory(27800),
      },
      {
        assetId: 'asset_005',
        assetName: 'TikTok Ads Pool',
        assetSymbol: 'TAP',
        amount: 13500,
        allocation: 5.5,
        currentValue: 12140,
        profitLoss: -1360,
        profitPercent: -10.1,
        driftPercent: 0,
        driftDirection: 'NONE',
        priceHistory: genHistory(12140),
      },
    ],
  },
  {
    id: 'portfolio_002',
    sellerId: 'user_seller',
    investorId: 'investor_002',
    investorName: 'Rachel Torres',
    totalInvested: 120000,
    currentValue: 152400,
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    assets: [
      {
        assetId: 'asset_004',
        assetName: 'Quantum Logistics Ltd',
        assetSymbol: 'QLL',
        amount: 72000,
        allocation: 60.0,
        currentValue: 94200,
        profitLoss: 22200,
        profitPercent: 30.8,
        driftPercent: 0,
        driftDirection: 'NONE',
        priceHistory: genHistory(94200),
      },
      {
        assetId: 'asset_008',
        assetName: 'PharmaLink Diagnostics',
        assetSymbol: 'PLD',
        amount: 48000,
        allocation: 40.0,
        currentValue: 58200,
        profitLoss: 10200,
        profitPercent: 21.25,
        driftPercent: 0,
        driftDirection: 'NONE',
        priceHistory: genHistory(58200),
      },
    ],
  },
]

// ── AI suggestion logic ──────────────────────────────────────
function analyzeChat(chatHistory: string[], investorProfile: string): AISuggestion {
  const allText = [...chatHistory, investorProfile].join(' ').toLowerCase()

  const isConservative = /conserv|stable|low.?risk|safe|bond|protect/.test(allText)
  const isAggressive = /aggress|high.?return|growth|maximum|bold|specul/.test(allText)
  const horizonLong = /long.?term|5.?year|10.?year|patient|hold/.test(allText)
  const mentionsAmount = allText.match(/\$?([\d,]+)\s*k?\b/)

  let suggestedAmount = 50000
  if (mentionsAmount) {
    const raw = parseInt(mentionsAmount[1].replace(/,/g, ''))
    suggestedAmount = raw >= 1000 ? raw : raw * 1000
    suggestedAmount = Math.min(Math.max(suggestedAmount, 5000), 500000)
  }

  const allocations = isConservative
    ? [
        {
          assetId: 'asset_003',
          assetName: 'StableYield Coin',
          percent: 40,
          reasoning:
            'Low-volatility stablecoin strategy provides predictable yield — ideal for conservative allocation.',
        },
        {
          assetId: 'asset_006',
          assetName: 'GreenVolt Energy',
          percent: 35,
          reasoning:
            'Government-backed renewable energy with guaranteed offtake minimizes downside risk.',
        },
        {
          assetId: 'asset_001',
          assetName: 'MetaGrowth Token',
          percent: 25,
          reasoning:
            'Moderate allocation to digital advertising token provides growth exposure while maintaining balance.',
        },
      ]
    : isAggressive
    ? [
        {
          assetId: 'asset_004',
          assetName: 'Quantum Logistics Ltd',
          percent: 35,
          reasoning:
            'Highest performer by score with strong Series B momentum — primary growth driver.',
        },
        {
          assetId: 'asset_002',
          assetName: 'AlphaScale Ventures',
          percent: 30,
          reasoning:
            'Fintech lending at 24.1% return rate with proven unit economics — aggressive but calculated.',
        },
        {
          assetId: 'asset_008',
          assetName: 'PharmaLink Diagnostics',
          percent: 20,
          reasoning:
            'High-margin diagnostics play with FDA clearance — asymmetric upside if telehealth scales.',
        },
        {
          assetId: 'asset_007',
          assetName: 'DataStream Token',
          percent: 15,
          reasoning:
            'Data commerce token with monthly USDC dividends — diversifies into digital asset yield.',
        },
      ]
    : [
        {
          assetId: 'asset_002',
          assetName: 'AlphaScale Ventures',
          percent: 30,
          reasoning:
            'Strong fintech fundamentals with consistent 34% YoY growth — core balanced holding.',
        },
        {
          assetId: 'asset_006',
          assetName: 'GreenVolt Energy',
          percent: 25,
          reasoning:
            'ESG-compliant clean energy with stable cash flows — counterbalances higher-risk positions.',
        },
        {
          assetId: 'asset_007',
          assetName: 'DataStream Token',
          percent: 25,
          reasoning:
            'Data token offers digital diversification with reliable monthly dividends.',
        },
        {
          assetId: 'asset_003',
          assetName: 'StableYield Coin',
          percent: 20,
          reasoning:
            'Stable base layer that reduces portfolio volatility and provides liquidity buffer.',
        },
      ]

  const confidenceScore = isConservative
    ? 91
    : isAggressive
    ? 87
    : horizonLong
    ? 89
    : 84

  const overallReasoning = isConservative
    ? `Based on your conservative investment profile, this allocation prioritizes capital preservation and steady income generation. The portfolio is weighted toward low-volatility assets (75%+) with inflation-beating returns. Expected blended annual return: 12–16% with maximum drawdown below 8%.`
    : isAggressive
    ? `Your aggressive growth orientation suggests maximizing exposure to high-conviction opportunities. This portfolio targets top-performing assets by score, accepting higher volatility in exchange for superior return potential. Expected blended annual return: 24–32% with managed concentration risk.`
    : `A balanced allocation reflecting your medium risk appetite and ${horizonLong ? 'long-term' : 'medium-term'} horizon. Diversified across fintech, clean energy, data commerce, and stable yield to smooth volatility while capturing meaningful upside. Expected blended annual return: 16–22%.`

  return {
    suggestedAmount,
    allocations,
    overallReasoning,
    confidenceScore,
    basedOnMessages: chatHistory.length,
  }
}

// ── Store ────────────────────────────────────────────────────
export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolios: SEED_PORTFOLIOS,
  aiSuggestion: null,
  isGeneratingAI: false,
  driftEvents: [],
  isSimulating: false,

  createPortfolio: (portfolio) => {
    const newPortfolio: Portfolio = {
      ...portfolio,
      id: `portfolio_${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    }
    set((state) => ({ portfolios: [...state.portfolios, newPortfolio] }))
  },

  updatePortfolio: (id, updates) => {
    set((state) => ({
      portfolios: state.portfolios.map((p) =>
        p.id === id ? { ...p, ...updates, lastUpdated: new Date().toISOString() } : p,
      ),
    }))
  },

  generateAISuggestion: async (chatHistory, investorProfile, context?) => {
    set({ isGeneratingAI: true, aiSuggestion: null })
    try {
      const res = await fetch('/api/ai/portfolio-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatHistory,
          investorProfile,
          selectedAssets: context?.selectedAssets || [],
          investorName: context?.investorName || 'Investor',
          requestedAmount: context?.requestedAmount || 50000,
        }),
      })
      if (res.ok) {
        const suggestion = await res.json()
        set({ aiSuggestion: suggestion, isGeneratingAI: false })
        return
      }
    } catch {
      // Fall back to local analysis
    }
    // Fallback: local keyword-based analysis
    await new Promise((resolve) => setTimeout(resolve, 1200))
    const suggestion = analyzeChat(chatHistory, investorProfile)
    set({ aiSuggestion: suggestion, isGeneratingAI: false })
  },

  applyMarketDrift: (assetId, assetName, direction, percent) => {
    const multiplier = direction === 'UP' ? 1 + percent / 100 : 1 - percent / 100
    const today = new Date().toISOString().split('T')[0]

    set((state) => {
      let affectedCount = 0
      const portfolios = state.portfolios.map((portfolio) => {
        const hasAsset = portfolio.assets.some((a) => a.assetId === assetId)
        if (!hasAsset) return portfolio
        affectedCount++

        const assets = portfolio.assets.map((asset) => {
          if (asset.assetId !== assetId) return asset
          const newValue = Math.round(asset.currentValue * multiplier * 100) / 100
          const profitLoss = newValue - asset.amount
          const profitPercent = (profitLoss / asset.amount) * 100
          const newHistory = [
            ...asset.priceHistory,
            { date: today, value: newValue },
          ].slice(-60)

          return {
            ...asset,
            currentValue: newValue,
            profitLoss: Math.round(profitLoss * 100) / 100,
            profitPercent: Math.round(profitPercent * 100) / 100,
            driftPercent: percent,
            driftDirection: direction,
            priceHistory: newHistory,
          }
        })

        const currentValue = assets.reduce((s, a) => s + a.currentValue, 0)
        return {
          ...portfolio,
          assets,
          currentValue: Math.round(currentValue * 100) / 100,
          lastUpdated: new Date().toISOString(),
        }
      })

      const driftEvent: DriftEvent = {
        assetId,
        assetName,
        direction,
        percent,
        timestamp: new Date().toISOString(),
        affectedPortfolios: affectedCount,
      }

      return {
        portfolios,
        driftEvents: [driftEvent, ...state.driftEvents].slice(0, 50),
      }
    })
  },

  startVolatilitySimulation: (assetId, basePercent, direction) => {
    let tick = 0
    set({ isSimulating: true })

    const intervalId = setInterval(() => {
      tick++
      // Sinusoidal + noise: oscillate around base direction
      const sinusoidal = Math.sin(tick * 0.6) * 0.4
      const noise = (Math.random() - 0.5) * 0.3
      const rawPct = basePercent * 0.15 + Math.abs(sinusoidal + noise) * basePercent * 0.2
      const volatileDir: 'UP' | 'DOWN' =
        sinusoidal + noise > 0 ? direction : direction === 'UP' ? 'DOWN' : 'UP'

      get().applyMarketDrift(assetId, `Asset ${assetId}`, volatileDir, Math.max(0.1, rawPct))
    }, 800)

    return () => {
      clearInterval(intervalId)
      set({ isSimulating: false })
    }
  },

  getInvestorPortfolio: (investorId) => {
    return get().portfolios.find((p) => p.investorId === investorId)
  },
}))
