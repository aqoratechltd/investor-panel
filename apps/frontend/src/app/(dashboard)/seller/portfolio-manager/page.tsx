'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight, CheckCircle, Sparkles, TrendingUp, TrendingDown,
  BarChart3, Plus, Minus, RefreshCw, History, Zap, X,
  Building2, Coins, ChevronDown, User, AlertTriangle, Brain,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'
import { useMarketplaceStore, type MarketAsset } from '@/stores/marketplace.store'
import { usePortfolioStore } from '@/stores/portfolio.store'
import { StatusBadge } from '@/components/ui/status-badge'

// ── Step Indicator ────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={step} className="flex items-center">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
              done ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
              : active ? 'bg-brand-500/20 border-brand-500 text-brand-400'
              : 'bg-white/[0.03] border-white/10 text-muted-foreground',
            )}>
              {done ? <CheckCircle className="w-4 h-4" /> : step}
            </div>
            {i < total - 1 && (
              <div className={cn(
                'w-16 h-0.5 mx-1 transition-all',
                done ? 'bg-emerald-500/50' : 'bg-white/10',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Asset Selection Card ──────────────────────────────────────
function AssetSelectCard({
  asset,
  selected,
  onToggle,
}: {
  asset: MarketAsset
  selected: boolean
  onToggle: () => void
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onToggle}
      className={cn(
        'p-4 rounded-xl border cursor-pointer transition-all duration-200',
        selected
          ? 'border-brand-500/50 bg-brand-500/10 shadow-[0_0_16px_rgba(6,182,212,0.1)]'
          : 'border-white/8 bg-white/[0.02] hover:border-white/15',
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: asset.iconColor + '22', border: `1px solid ${asset.iconColor}44` }}
          >
            {asset.type === 'COIN' ? (
              <Coins className="w-4 h-4" style={{ color: asset.iconColor }} />
            ) : (
              <Building2 className="w-4 h-4" style={{ color: asset.iconColor }} />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">{asset.name}</p>
            <p className="text-[10px] text-muted-foreground font-mono">{asset.symbol}</p>
          </div>
        </div>
        <div className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
          selected ? 'border-brand-500 bg-brand-500' : 'border-white/20',
        )}>
          {selected && <CheckCircle className="w-3 h-3 text-white" />}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={cn(
          'text-xs font-mono font-bold',
          asset.returnRate >= 0 ? 'text-emerald-400' : 'text-red-400',
        )}>
          {formatPercent(asset.returnRate)} p.a.
        </span>
        <span className={cn(
          'text-[10px] px-1.5 py-0.5 rounded-md',
          asset.type === 'COIN'
            ? 'bg-amber-500/10 text-amber-400'
            : 'bg-brand-500/10 text-brand-400',
        )}>
          {asset.type}
        </span>
      </div>
    </motion.div>
  )
}

// ── AI Suggestion Panel ───────────────────────────────────────
function AISuggestionPanel({
  selectedAssets,
  chatHistory,
  investorProfile,
  investorName,
  requestedAmount,
  onAccept,
}: {
  selectedAssets: MarketAsset[]
  chatHistory: string[]
  investorProfile: string
  investorName?: string
  requestedAmount?: number
  onAccept: (allocations: Record<string, number>) => void
}) {
  const { aiSuggestion, isGeneratingAI, generateAISuggestion } = usePortfolioStore()
  const [accepted, setAccepted] = useState(false)

  const handleGenerate = () => {
    generateAISuggestion(chatHistory, investorProfile, {
      selectedAssets,
      investorName,
      requestedAmount,
    })
    setAccepted(false)
  }

  const handleAccept = () => {
    if (!aiSuggestion) return
    const allocs: Record<string, number> = {}
    aiSuggestion.allocations.forEach((a) => {
      allocs[a.assetId] = (aiSuggestion.suggestedAmount * a.percent) / 100
    })
    onAccept(allocs)
    setAccepted(true)
  }

  return (
    <div className="gradient-border p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-brand-400" />
          </div>
          <h3 className="font-display font-bold">AI Allocation Suggestion</h3>
        </div>
        <Button size="sm" onClick={handleGenerate} loading={isGeneratingAI} className="gap-1.5">
          {!isGeneratingAI && <Sparkles className="w-3.5 h-3.5" />}
          Generate AI Allocation
        </Button>
      </div>

      {/* Loading state */}
      {isGeneratingAI && (
        <div className="py-8 text-center">
          <div className="flex items-center justify-center gap-2 text-brand-400 mb-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                className="w-2 h-2 rounded-full bg-brand-400"
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">GPT-4o analyzing investor profile & chat history...</p>
          <p className="text-xs text-muted-foreground mt-1">Generating optimal allocations with AI</p>
        </div>
      )}

      {/* Suggestion results */}
      {!isGeneratingAI && aiSuggestion && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Header stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/8">
              <p className="text-[10px] text-muted-foreground mb-1">Suggested Amount</p>
              <p className="text-sm font-bold font-mono text-brand-400">
                {formatCurrency(aiSuggestion.suggestedAmount)}
              </p>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/8">
              <p className="text-[10px] text-muted-foreground mb-1">Confidence</p>
              <p className="text-sm font-bold font-mono text-emerald-400">
                {aiSuggestion.confidenceScore}%
              </p>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/8">
              <p className="text-[10px] text-muted-foreground mb-1">Based On</p>
              <p className="text-sm font-bold font-mono">
                {aiSuggestion.basedOnMessages} msgs
              </p>
            </div>
          </div>

          {/* Allocations */}
          <div className="space-y-3">
            {aiSuggestion.allocations.map((alloc) => (
              <div key={alloc.assetId} className="p-3 rounded-xl bg-white/[0.02] border border-white/8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{alloc.assetName}</span>
                  <span className="text-sm font-bold font-mono text-brand-400">{alloc.percent}%</span>
                </div>
                {/* Percentage bar */}
                <div className="h-1.5 bg-white/5 rounded-full mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${alloc.percent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">{alloc.reasoning}</p>
              </div>
            ))}
          </div>

          {/* Overall Reasoning */}
          <div className="p-4 rounded-xl border border-brand-500/20 bg-brand-500/5">
            <p className="text-xs font-medium text-brand-400 mb-1.5">Overall Reasoning</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {aiSuggestion.overallReasoning}
            </p>
          </div>

          {/* Accept/Override */}
          {!accepted ? (
            <Button onClick={handleAccept} className="w-full gap-2">
              <CheckCircle className="w-4 h-4" />
              Accept AI Suggestion
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-2 text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Suggestion applied to allocation inputs
            </div>
          )}
        </motion.div>
      )}

      {!isGeneratingAI && !aiSuggestion && (
        <div className="py-8 text-center text-muted-foreground">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Click "Generate AI Allocation" to get smart suggestions</p>
          <p className="text-xs mt-1">Based on investor chat history and profile keywords</p>
        </div>
      )}
    </div>
  )
}

// ── Allocation Input Row ──────────────────────────────────────
function AllocationRow({
  asset,
  amount,
  total,
  onChange,
}: {
  asset: MarketAsset
  amount: number
  total: number
  onChange: (v: number) => void
}) {
  const pct = total > 0 ? (amount / total) * 100 : 0

  return (
    <div className="p-4 rounded-xl border border-white/8 bg-white/[0.02] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: asset.iconColor + '22' }}
          >
            {asset.type === 'COIN' ? (
              <Coins className="w-3.5 h-3.5" style={{ color: asset.iconColor }} />
            ) : (
              <Building2 className="w-3.5 h-3.5" style={{ color: asset.iconColor }} />
            )}
          </div>
          <span className="text-sm font-semibold">{asset.name}</span>
          <span className="text-xs text-muted-foreground font-mono">{asset.symbol}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-xs font-mono font-bold px-2 py-0.5 rounded-full',
            pct > 0 ? 'bg-brand-500/10 text-brand-400' : 'bg-white/5 text-muted-foreground',
          )}>
            {pct.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Slider */}
        <input
          type="range"
          min={0}
          max={500000}
          step={1000}
          value={amount}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-brand-500 cursor-pointer"
        />
        {/* Number input */}
        <div className="relative w-32">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
          <input
            type="number"
            value={amount || ''}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
            className="w-full h-9 pl-6 pr-3 rounded-lg border border-white/10 bg-white/[0.03] text-sm font-mono focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-right"
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5 rounded-full">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}

// ── Drift Controller ──────────────────────────────────────────
function DriftController({ selectedAssets }: { selectedAssets: MarketAsset[] }) {
  const { applyMarketDrift, driftEvents, startVolatilitySimulation, isSimulating } = usePortfolioStore()
  const [selectedAssetId, setSelectedAssetId] = useState(selectedAssets[0]?.id || '')
  const [direction, setDirection] = useState<'UP' | 'DOWN'>('UP')
  const [percent, setPercent] = useState(5)
  const cleanupRef = useRef<(() => void) | null>(null)
  const [volatilityOn, setVolatilityOn] = useState(false)
  const [aiCommentary, setAiCommentary] = useState<string | null>(null)
  const [loadingCommentary, setLoadingCommentary] = useState(false)

  const handleApply = async () => {
    const asset = selectedAssets.find((a) => a.id === selectedAssetId)
    if (!asset) return
    applyMarketDrift(selectedAssetId, asset.name, direction, percent)

    // Fetch AI commentary
    setAiCommentary(null)
    setLoadingCommentary(true)
    try {
      const res = await fetch('/api/ai/drift-commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetName: asset.name,
          assetSymbol: asset.symbol,
          direction,
          percent,
          affectedPortfolios: 1,
          assetType: asset.type,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setAiCommentary(data.commentary)
      }
    } catch {}
    setLoadingCommentary(false)
  }

  const handleVolatilityToggle = () => {
    if (volatilityOn) {
      cleanupRef.current?.()
      cleanupRef.current = null
      setVolatilityOn(false)
    } else {
      const asset = selectedAssets.find((a) => a.id === selectedAssetId)
      if (!asset) return
      const cleanup = startVolatilitySimulation(selectedAssetId, percent, direction)
      cleanupRef.current = cleanup
      setVolatilityOn(true)
    }
  }

  // Preview sparkline — last 10 points
  const previewPoints = Array.from({ length: 10 }, (_, i) => {
    const base = 100
    const drift = direction === 'UP' ? 1 + (percent / 100) * ((i + 1) / 10) : 1 - (percent / 100) * ((i + 1) / 10)
    return base * drift + (Math.random() - 0.5) * 2
  })
  const pMin = Math.min(...previewPoints)
  const pMax = Math.max(...previewPoints)
  const pRange = pMax - pMin || 1

  return (
    <div className="space-y-6">
      {/* Main Drift Card */}
      <div className="gradient-border p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)' }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="font-display font-bold">Market Movement Simulator</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Asset Select */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Asset</label>
            <div className="relative">
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full h-10 pl-3 pr-8 rounded-xl border border-white/10 bg-white/[0.03] text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-brand-500/50"
              >
                {selectedAssets.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Percent */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Percentage (1–50%)
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={percent}
              onChange={(e) => setPercent(Math.min(50, Math.max(1, Number(e.target.value))))}
              className="w-full h-10 px-3 rounded-xl border border-white/10 bg-white/[0.03] text-sm font-mono focus:outline-none focus:ring-1 focus:ring-brand-500/50"
            />
          </div>
        </div>

        {/* Direction Toggle */}
        <div className="mb-5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Direction</label>
          <div className="flex gap-3">
            <button
              onClick={() => setDirection('UP')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-medium transition-all',
                direction === 'UP'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'border-white/10 text-muted-foreground hover:text-foreground',
              )}
            >
              <TrendingUp className="w-4 h-4" />
              Gain
            </button>
            <button
              onClick={() => setDirection('DOWN')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-medium transition-all',
                direction === 'DOWN'
                  ? 'bg-red-500/15 border-red-500/40 text-red-400'
                  : 'border-white/10 text-muted-foreground hover:text-foreground',
              )}
            >
              <TrendingDown className="w-4 h-4" />
              Loss
            </button>
          </div>
        </div>

        {/* Preview Chart */}
        <div className="mb-5 p-4 rounded-xl bg-white/[0.02] border border-white/8">
          <p className="text-xs text-muted-foreground mb-2">Live Preview — {percent}% {direction.toLowerCase()}</p>
          <div className="flex items-end gap-px h-12">
            {previewPoints.map((pt, i) => {
              const h = ((pt - pMin) / pRange) * 100
              return (
                <div
                  key={i}
                  className={cn(
                    'flex-1 rounded-sm',
                    direction === 'UP' ? 'bg-emerald-500/40' : 'bg-red-500/40',
                  )}
                  style={{ height: `${Math.max(10, h)}%` }}
                />
              )
            })}
          </div>
        </div>

        {/* Natural Volatility Toggle */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-white/8 bg-white/[0.02] mb-5">
          <div>
            <p className="text-sm font-medium mb-0.5">Natural Volatility Simulation</p>
            <p className="text-xs text-muted-foreground">
              Runs sinusoidal + noise drift every 800ms around the selected direction. Simulates realistic market micro-fluctuations.
            </p>
          </div>
          <button
            onClick={handleVolatilityToggle}
            className={cn(
              'w-12 h-6 rounded-full border-2 transition-all flex-shrink-0 mt-0.5 relative',
              volatilityOn ? 'bg-brand-500 border-brand-500' : 'bg-white/10 border-white/20',
            )}
          >
            <div className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all',
              volatilityOn ? 'left-6' : 'left-0.5',
            )} />
          </button>
        </div>

        <Button onClick={handleApply} className="w-full gap-2" disabled={!selectedAssetId || selectedAssets.length === 0} loading={loadingCommentary}>
          <Zap className="w-4 h-4" />
          Apply Drift
        </Button>

        {/* AI Commentary */}
        <AnimatePresence>
          {(aiCommentary || loadingCommentary) && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-4 rounded-xl border border-brand-500/20 bg-brand-500/5"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span className="text-[10px] font-medium text-brand-400 uppercase tracking-wider">AI Analyst Note</span>
              </div>
              {loadingCommentary ? (
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Generating commentary...
                </div>
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed">{aiCommentary}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Drift History */}
      {driftEvents.length > 0 && (
        <div className="gradient-border p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">Drift History</h4>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {driftEvents.slice(0, 10).map((ev, i) => (
              <div key={i} className="flex items-center gap-3 text-xs py-2 border-b border-white/[0.05] last:border-0">
                <div className={cn(
                  'w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0',
                  ev.direction === 'UP' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400',
                )}>
                  {ev.direction === 'UP' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                </div>
                <span className="flex-1 truncate font-medium">{ev.assetName}</span>
                <span className={cn(
                  'font-mono font-bold',
                  ev.direction === 'UP' ? 'text-emerald-400' : 'text-red-400',
                )}>
                  {ev.direction === 'UP' ? '+' : '-'}{ev.percent.toFixed(1)}%
                </span>
                <span className="text-muted-foreground">{ev.affectedPortfolios} portfolio{ev.affectedPortfolios !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function PortfolioManagerPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { inquiries } = useMarketplaceStore()
  const { assets } = useMarketplaceStore()
  const { createPortfolio } = usePortfolioStore()
  const { aiSuggestion } = usePortfolioStore()

  const preselectedInvestorId = searchParams.get('investorId') || ''

  // Approved investors
  const approvedInvestors = inquiries.filter((inq) => inq.status === 'APPROVED')

  const [step, setStep] = useState(1)
  const [selectedInvestorId, setSelectedInvestorId] = useState(preselectedInvestorId)
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set())
  const [allocations, setAllocations] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const selectedInvestor = inquiries.find((i) => i.investorId === selectedInvestorId)
  const selectedAssets = assets.filter((a) => selectedAssetIds.has(a.id))

  const totalAllocated = Object.values(allocations).reduce((s, v) => s + v, 0)

  // Chat history from the investor's lead
  const chatHistory = (() => {
    const lead = inquiries.find((i) => i.investorId === selectedInvestorId)
    if (!lead) return []
    return [lead.investmentThesis, lead.portfolioHistory]
  })()

  const toggleAsset = (id: string) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setAllocations((a) => {
          const { [id]: _, ...rest } = a
          return rest
        })
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleAcceptAI = (aiAllocs: Record<string, number>) => {
    setAllocations((prev) => ({ ...prev, ...aiAllocs }))
  }

  const handleSave = async () => {
    if (!selectedInvestor) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))

    createPortfolio({
      sellerId: 'user_seller',
      investorId: selectedInvestor.investorId,
      investorName: selectedInvestor.investorName,
      status: 'ACTIVE',
      totalInvested: totalAllocated,
      currentValue: totalAllocated,
      assets: selectedAssets.map((asset) => ({
        assetId: asset.id,
        assetName: asset.name,
        assetSymbol: asset.symbol,
        amount: allocations[asset.id] || 0,
        allocation: totalAllocated > 0 ? ((allocations[asset.id] || 0) / totalAllocated) * 100 : 0,
        currentValue: allocations[asset.id] || 0,
        profitLoss: 0,
        profitPercent: 0,
        driftPercent: 0,
        driftDirection: 'NONE' as const,
        priceHistory: [],
      })),
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => router.push('/seller/investors'), 1500)
  }

  return (
    <DashboardLayout
      role="SELLER"
      title="Portfolio Manager"
      subtitle="Build AI-powered portfolios for your investors"
    >
      <StepIndicator current={step} total={4} />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left — Main Steps */}
        <div className="lg:col-span-2 space-y-6">

          {/* Step 1: Select Investor */}
          <div className={cn('gradient-border p-6 rounded-2xl transition-all', step !== 1 && 'opacity-60')}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold',
                  step > 1 ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-brand-500 bg-brand-500/20 text-brand-400',
                )}>
                  {step > 1 ? <CheckCircle className="w-4 h-4" /> : '1'}
                </div>
                <div>
                  <h3 className="font-display font-bold">Select Investor</h3>
                  <p className="text-xs text-muted-foreground">Choose from approved investors</p>
                </div>
              </div>
              {step > 1 && (
                <Button size="sm" variant="ghost" onClick={() => setStep(1)}>Edit</Button>
              )}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                {approvedInvestors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No approved investors yet</p>
                    <p className="text-xs mt-1">Approve leads from the Leads page first</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {approvedInvestors.map((inq) => (
                      <div
                        key={inq.investorId}
                        onClick={() => setSelectedInvestorId(inq.investorId)}
                        className={cn(
                          'p-4 rounded-xl border cursor-pointer transition-all duration-200',
                          selectedInvestorId === inq.investorId
                            ? 'border-brand-500/50 bg-brand-500/10'
                            : 'border-white/8 hover:border-white/15 bg-white/[0.02]',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400/20 to-brand-600/20 flex items-center justify-center text-sm font-bold text-brand-400">
                              {inq.investorName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{inq.investorName}</p>
                              <p className="text-xs text-muted-foreground">{inq.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono font-bold text-emerald-400">
                              {formatCurrency(inq.requestedAmount)}
                            </p>
                            <StatusBadge status={inq.status} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  className="w-full gap-2"
                  disabled={!selectedInvestorId}
                  onClick={() => setStep(2)}
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {step > 1 && selectedInvestor && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{selectedInvestor.investorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedInvestor.email} · {formatCurrency(selectedInvestor.requestedAmount)} requested
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Select Assets */}
          <div className={cn('gradient-border p-6 rounded-2xl transition-all', step < 2 && 'opacity-40 pointer-events-none')}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold',
                  step > 2 ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : step === 2 ? 'border-brand-500 bg-brand-500/20 text-brand-400'
                  : 'border-white/20 text-muted-foreground',
                )}>
                  {step > 2 ? <CheckCircle className="w-4 h-4" /> : '2'}
                </div>
                <div>
                  <h3 className="font-display font-bold">Select Assets</h3>
                  <p className="text-xs text-muted-foreground">{selectedAssetIds.size} selected</p>
                </div>
              </div>
              {step > 2 && (
                <Button size="sm" variant="ghost" onClick={() => setStep(2)}>Edit</Button>
              )}
            </div>

            {step === 2 && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  {assets.map((asset, i) => (
                    <motion.div
                      key={asset.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <AssetSelectCard
                        asset={asset}
                        selected={selectedAssetIds.has(asset.id)}
                        onToggle={() => toggleAsset(asset.id)}
                      />
                    </motion.div>
                  ))}
                </div>
                <Button
                  className="w-full gap-2"
                  disabled={selectedAssetIds.size === 0}
                  onClick={() => setStep(3)}
                >
                  Continue with {selectedAssetIds.size} asset{selectedAssetIds.size !== 1 ? 's' : ''}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {step > 2 && selectedAssets.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedAssets.map((a) => (
                  <span key={a.id} className="text-xs px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    {a.symbol}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Step 3: Allocation */}
          <div className={cn('gradient-border p-6 rounded-2xl transition-all', step < 3 && 'opacity-40 pointer-events-none')}>
            <div className="flex items-center gap-3 mb-5">
              <div className={cn(
                'w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold',
                step > 3 ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                : step === 3 ? 'border-brand-500 bg-brand-500/20 text-brand-400'
                : 'border-white/20 text-muted-foreground',
              )}>
                {step > 3 ? <CheckCircle className="w-4 h-4" /> : '3'}
              </div>
              <div>
                <h3 className="font-display font-bold">Set Allocation Amounts</h3>
                <p className="text-xs text-muted-foreground">Use AI suggestions or set manually</p>
              </div>
            </div>

            {step >= 3 && (
              <div className="space-y-4">
                {/* Total summary */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/8">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Allocated</p>
                    <p className="text-xl font-bold font-mono text-brand-400">
                      {formatCurrency(totalAllocated)}
                    </p>
                  </div>
                  {selectedInvestor && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Requested</p>
                      <p className="text-xl font-bold font-mono text-emerald-400">
                        {formatCurrency(selectedInvestor.requestedAmount)}
                      </p>
                    </div>
                  )}
                </div>

                {selectedAssets.map((asset) => (
                  <AllocationRow
                    key={asset.id}
                    asset={asset}
                    amount={allocations[asset.id] || 0}
                    total={totalAllocated}
                    onChange={(v) => setAllocations((prev) => ({ ...prev, [asset.id]: v }))}
                  />
                ))}

                <Button
                  className="w-full gap-2"
                  disabled={totalAllocated === 0}
                  onClick={() => setStep(4)}
                >
                  Continue to Review
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Step 4: Review & Save */}
          <div className={cn('gradient-border p-6 rounded-2xl transition-all', step < 4 && 'opacity-40 pointer-events-none')}>
            <div className="flex items-center gap-3 mb-5">
              <div className={cn(
                'w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold',
                step === 4 ? 'border-brand-500 bg-brand-500/20 text-brand-400' : 'border-white/20 text-muted-foreground',
              )}>
                4
              </div>
              <div>
                <h3 className="font-display font-bold">Review & Save Portfolio</h3>
                <p className="text-xs text-muted-foreground">Confirm before creating</p>
              </div>
            </div>

            {step === 4 && (
              <div className="space-y-4">
                {selectedAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between py-2 border-b border-white/[0.06] last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md" style={{ backgroundColor: asset.iconColor + '22' }}>
                        <div className="w-full h-full flex items-center justify-center">
                          {asset.type === 'COIN' ? (
                            <Coins className="w-3 h-3" style={{ color: asset.iconColor }} />
                          ) : (
                            <Building2 className="w-3 h-3" style={{ color: asset.iconColor }} />
                          )}
                        </div>
                      </div>
                      <span className="text-sm">{asset.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono font-bold">
                        {formatCurrency(allocations[asset.id] || 0)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({totalAllocated > 0 ? (((allocations[asset.id] || 0) / totalAllocated) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2 font-bold">
                  <span>Total Portfolio</span>
                  <span className="font-mono text-brand-400">{formatCurrency(totalAllocated)}</span>
                </div>

                {saved ? (
                  <div className="flex items-center justify-center gap-2 py-3 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <span>Portfolio created! Redirecting...</span>
                  </div>
                ) : (
                  <Button
                    className="w-full gap-2"
                    loading={saving}
                    onClick={handleSave}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Save Portfolio
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right — AI + Drift */}
        <div className="space-y-6">
          {step >= 3 && selectedAssets.length > 0 && (
            <AISuggestionPanel
              selectedAssets={selectedAssets}
              chatHistory={chatHistory}
              investorProfile={selectedInvestor?.investmentThesis || ''}
              investorName={selectedInvestor?.investorName}
              requestedAmount={selectedInvestor?.requestedAmount}
              onAccept={handleAcceptAI}
            />
          )}
          {step >= 2 && selectedAssets.length > 0 && (
            <DriftController selectedAssets={selectedAssets} />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
