'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, Search, Star, Sparkles, RefreshCw } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TradingChart, generateOHLC } from '@/components/charts/trading-chart'
import { useCurrencyStore } from '@/stores/currency.store'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { cn } from '@/lib/utils'

// Generate persistent OHLC data per asset
const ASSET_CHARTS: Record<string, ReturnType<typeof generateOHLC>> = {}
function getChart(id: string, price: number, vol: number) {
  if (!ASSET_CHARTS[id]) {
    ASSET_CHARTS[id] = generateOHLC(price, 365, vol, 0.0008)
  }
  return ASSET_CHARTS[id]
}

export default function MarketPage() {
  const { assets, initialize, isLoaded } = useMarketplaceStore()
  const { format } = useCurrencyStore()

  useEffect(() => { if (!isLoaded) initialize() }, [isLoaded, initialize])

  const [selected, setSelected] = useState(assets[0])
  const [search, setSearch] = useState('')
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [loadingInsight, setLoadingInsight] = useState(false)
  const insightAssetRef = useRef<string | null>(null)

  const filtered = assets.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.symbol.toLowerCase().includes(search.toLowerCase()),
  )

  const chartData = useMemo(
    () => getChart(selected.id, selected.currentPrice, selected.riskLevel === 'HIGH' ? 0.05 : selected.riskLevel === 'MEDIUM' ? 0.03 : 0.015),
    [selected],
  )

  const last = chartData[chartData.length - 1]
  const first = chartData[0]
  const pct = first ? ((last.close - first.open) / first.open) * 100 : 0

  // Fetch AI insight when selected asset changes
  useEffect(() => {
    if (!selected) return
    insightAssetRef.current = selected.id
    setAiInsight(null)
    setLoadingInsight(true)

    fetch('/api/ai/market-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetName: selected.name,
        assetSymbol: selected.symbol,
        assetType: selected.type,
        returnRate: selected.returnRate,
        riskLevel: selected.riskLevel,
        category: selected.category,
        pctChange: pct,
        currentPrice: last?.close,
      }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (insightAssetRef.current === selected.id) {
          setAiInsight(data?.insight || null)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (insightAssetRef.current === selected.id) setLoadingInsight(false)
      })
  }, [selected.id])

  return (
    <DashboardLayout role="INVESTOR" title="Market" subtitle="Live asset prices and trading charts">
      <div className="flex gap-6 h-[calc(100vh-160px)] min-h-[600px]">

        {/* Left: Asset List */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets..."
              className="w-full pl-9 pr-3 h-9 bg-muted/40 border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {filtered.map((asset, i) => {
              const aChart = getChart(asset.id, asset.currentPrice, 0.03)
              const aLast = aChart[aChart.length - 1]
              const aFirst = aChart[0]
              const aPct = aFirst ? ((aLast.close - aFirst.open) / aFirst.open) * 100 : 0
              const isPos = aPct >= 0
              const isActive = selected.id === asset.id

              return (
                <motion.button
                  key={asset.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelected(asset)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                    isActive
                      ? 'bg-brand-500/10 border-brand-500/30'
                      : 'border-border hover:bg-white/5 hover:border-white/10',
                  )}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: `${asset.iconColor}22`, color: asset.iconColor }}
                  >
                    {asset.symbol.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{asset.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{asset.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-medium">{format(aLast.close, true)}</p>
                    <p className={cn('text-[10px] font-mono', isPos ? 'text-emerald-400' : 'text-red-400')}>
                      {isPos ? '+' : ''}{aPct.toFixed(2)}%
                    </p>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Right: Chart */}
        <div className="flex-1 gradient-border p-6 overflow-hidden flex flex-col"
          style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.01) 100%)' }}
        >
          {/* Asset header */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
              style={{ background: `${selected.iconColor}22`, color: selected.iconColor }}
            >
              {selected.symbol.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold">{selected.name}</h2>
                {selected.isTopPerforming && (
                  <span className="badge-warning text-[10px] px-1.5 py-0.5">⭐ Top</span>
                )}
                <span className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-medium border',
                  selected.type === 'COIN'
                    ? 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                    : 'bg-violet-500/10 text-violet-400 border-violet-500/20',
                )}>
                  {selected.type}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{selected.sellerCompany} · {selected.category}</p>
            </div>

            {/* Stats row */}
            <div className="ml-auto flex items-center gap-6">
              {[
                { label: 'Return', value: `${selected.returnRate >= 0 ? '+' : ''}${selected.returnRate}%`, colored: true, positive: selected.returnRate >= 0 },
                { label: 'Volume', value: format(selected.volume, true) },
                { label: 'Min. Invest', value: format(selected.minInvestment, true) },
                { label: 'Investors', value: `${selected.totalInvestors}` },
              ].map(({ label, value, colored, positive }) => (
                <div key={label} className="text-right hidden md:block">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className={cn(
                    'text-sm font-mono font-semibold',
                    colored ? (positive ? 'text-emerald-400' : 'text-red-400') : 'text-foreground',
                  )}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trading Chart */}
          <div className="flex-1">
            <TradingChart
              data={chartData}
              symbol={selected.symbol}
              height={420}
              showVolume
              showTimeframes
              showTypeToggle
            />
          </div>

          {/* AI Insight + Description */}
          <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
            <AnimatePresence mode="wait">
              {loadingInsight ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-xs text-brand-400/70"
                >
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Generating AI insight for {selected.name}...</span>
                </motion.div>
              ) : aiInsight ? (
                <motion.div
                  key="insight"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-2.5 p-3 rounded-xl border border-brand-500/20 bg-brand-500/5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{aiInsight}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
            <p className="text-xs text-muted-foreground leading-relaxed">{selected.description}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
