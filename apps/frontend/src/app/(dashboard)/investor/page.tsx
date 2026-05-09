'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, DollarSign, Coins,
  ArrowDownToLine, BarChart3, Award, Wallet,
  ArrowUpRight, Info, Sparkles, Clock, CheckCircle,
  ArrowUp, ArrowDown, Activity, Bell,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MetricCard } from '@/components/ui/metric-card'
import { AreaChart } from '@/components/charts/area-chart'
import { DonutChart } from '@/components/charts/donut-chart'
import { DataTable, type Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import {
  cn, formatCurrency, formatDate, formatPercent, formatNumber,
  getPnLColor, getPnLBg, CHANNEL_COLORS, CHANNEL_LABELS,
} from '@/lib/utils'
import { usePortfolioStore } from '@/stores/portfolio.store'
import { useAuthStore } from '@/stores/auth.store'

const TX_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PROFIT: { label: 'Profit', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: TrendingUp },
  LOSS: { label: 'Loss', color: 'text-red-400', bg: 'bg-red-500/10', icon: TrendingDown },
  DEPOSIT: { label: 'Deposit', color: 'text-brand-400', bg: 'bg-brand-500/10', icon: ArrowUpRight },
  WITHDRAWAL: { label: 'Withdrawal', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: ArrowDownToLine },
  COIN_EARN: { label: 'Coins', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Coins },
}

const INVESTMENT_COLS: Column[] = [
  { key: 'name', label: 'Investment', sortable: true },
  {
    key: 'channel', label: 'Channel',
    render: (v) => (
      <span className="flex items-center gap-2 text-sm">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHANNEL_COLORS[v] }} />
        {CHANNEL_LABELS[v]}
      </span>
    ),
  },
  { key: 'amount', label: 'Invested', sortable: true, render: (v) => <span className="font-mono">{formatCurrency(v)}</span> },
  { key: 'currentValue', label: 'Current Value', sortable: true, render: (v) => <span className="font-mono text-brand-400">{formatCurrency(v)}</span> },
  {
    key: 'profitLoss', label: 'P&L', sortable: true,
    render: (v) => (
      <span className={cn('font-mono font-medium', getPnLColor(v))}>
        {v >= 0 ? '+' : ''}{formatCurrency(v)}
      </span>
    ),
  },
  {
    key: 'profitPercent', label: 'ROI', sortable: true,
    render: (v) => (
      <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border', getPnLBg(v))}>
        {v >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {formatPercent(v)}
      </span>
    ),
  },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
]

// ─── Market Alerts Ticker ─────────────────────────────────────

function MarketAlertsTicker() {
  const { driftEvents } = usePortfolioStore()
  const [visibleIndex, setVisibleIndex] = useState(0)

  useEffect(() => {
    if (driftEvents.length === 0) return
    const interval = setInterval(() => {
      setVisibleIndex((i) => (i + 1) % driftEvents.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [driftEvents.length])

  if (driftEvents.length === 0) return null

  const ev = driftEvents[visibleIndex % driftEvents.length]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="mb-5 flex items-center gap-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 overflow-hidden"
    >
      <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
        <Bell className="w-3.5 h-3.5 text-amber-400" />
      </div>
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex-shrink-0">
        Market Alert
      </span>
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={ev.timestamp}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 text-xs"
          >
            <div className={cn(
              'flex items-center gap-1 font-semibold',
              ev.direction === 'UP' ? 'text-emerald-400' : 'text-red-400',
            )}>
              {ev.direction === 'UP' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {ev.direction === 'UP' ? '+' : '-'}{ev.percent.toFixed(1)}%
            </div>
            <span className="text-foreground/70">
              <strong className="text-foreground">{ev.assetName}</strong> moved{' '}
              {ev.direction === 'UP' ? 'up' : 'down'} — affected {ev.affectedPortfolios} portfolio{ev.affectedPortfolios !== 1 ? 's' : ''}
            </span>
            <span className="text-muted-foreground ml-auto flex-shrink-0">
              {formatDate(ev.timestamp, 'relative')}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
      {driftEvents.length > 1 && (
        <div className="flex gap-1 flex-shrink-0">
          {driftEvents.slice(0, Math.min(5, driftEvents.length)).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all',
                i === visibleIndex % driftEvents.length ? 'bg-amber-400' : 'bg-white/20',
              )}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ─── Live Portfolio Asset Row ─────────────────────────────────

function LivePortfolioAssetRow({ asset, index }: {
  asset: {
    assetId: string
    assetName: string
    assetSymbol: string
    amount: number
    currentValue: number
    profitLoss: number
    profitPercent: number
    driftDirection: 'UP' | 'DOWN' | 'NONE'
    driftPercent: number
    priceHistory: Array<{ date: string; value: number }>
  }
  index: number
}) {
  const isProfit = asset.profitLoss >= 0
  const driftGlow =
    asset.driftDirection === 'UP'
      ? 'shadow-[0_0_12px_rgba(16,185,129,0.15)] border-emerald-500/30'
      : asset.driftDirection === 'DOWN'
      ? 'shadow-[0_0_12px_rgba(239,68,68,0.15)] border-red-500/30'
      : 'border-white/8'

  // Mini sparkline bars
  const history = asset.priceHistory.slice(-12)
  const hMax = Math.max(...history.map((p) => p.value), 0.001)
  const hMin = Math.min(...history.map((p) => p.value), 0)
  const hRange = hMax - hMin || 1

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-all duration-500',
        driftGlow,
        'bg-white/[0.02]',
      )}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
        <Activity className="w-5 h-5 text-brand-400" />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold truncate">{asset.assetName}</p>
          <span className="text-[10px] text-muted-foreground font-mono">{asset.assetSymbol}</span>

          {/* Drift direction indicator */}
          {asset.driftDirection !== 'NONE' && (
            <motion.div
              animate={{ y: [0, asset.driftDirection === 'UP' ? -3 : 3, 0] }}
              transition={{ duration: 0.6, repeat: 3 }}
              className={cn(
                'flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md border',
                asset.driftDirection === 'UP'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20',
              )}
            >
              {asset.driftDirection === 'UP' ? (
                <ArrowUp className="w-2.5 h-2.5" />
              ) : (
                <ArrowDown className="w-2.5 h-2.5" />
              )}
              {asset.driftPercent.toFixed(1)}%
            </motion.div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Invested: {formatCurrency(asset.amount)}</p>
      </div>

      {/* Mini Sparkline */}
      <div className="flex items-end gap-px h-8 w-16 flex-shrink-0">
        {history.map((pt, i) => {
          const h = ((pt.value - hMin) / hRange) * 100
          return (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-sm',
                isProfit ? 'bg-emerald-500/40' : 'bg-red-500/40',
              )}
              style={{ height: `${Math.max(8, h)}%` }}
            />
          )
        })}
      </div>

      {/* P&L */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold font-mono">{formatCurrency(asset.currentValue)}</p>
        <p className={cn('text-xs font-mono', isProfit ? 'text-emerald-400' : 'text-red-400')}>
          {asset.profitLoss >= 0 ? '+' : ''}{formatCurrency(asset.profitLoss)}
        </p>
        <p className={cn(
          'text-[10px] font-mono px-1.5 py-0.5 rounded-md inline-block border mt-0.5',
          isProfit
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border-red-500/20',
        )}>
          {asset.profitPercent >= 0 ? '+' : ''}{asset.profitPercent.toFixed(1)}%
        </p>
      </div>
    </motion.div>
  )
}

// ─── Live Portfolio Section ───────────────────────────────────

function LivePortfolioSection() {
  const { getInvestorPortfolio, driftEvents } = usePortfolioStore()
  const { user } = useAuthStore()
  const portfolio = getInvestorPortfolio(user?.id || '')

  if (!portfolio) {
    return (
      <div className="gradient-border p-6 mb-8" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold">Live Portfolio</h3>
            <p className="text-xs text-muted-foreground">Real-time asset tracking</p>
          </div>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No live portfolio yet</p>
          <p className="text-xs mt-1">Visit the Marketplace to start investing</p>
        </div>
      </div>
    )
  }

  const overallPnL = portfolio.currentValue - portfolio.totalInvested
  const overallPct = portfolio.totalInvested > 0
    ? (overallPnL / portfolio.totalInvested) * 100
    : 0

  return (
    <div className="gradient-border p-6 mb-8" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-bold flex items-center gap-2">
            Live Portfolio
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {portfolio.assets.length} assets · Last updated{' '}
            {formatDate(portfolio.lastUpdated, 'relative')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Portfolio Value</p>
          <p className="text-xl font-bold font-mono text-brand-400">
            {formatCurrency(portfolio.currentValue)}
          </p>
          <p className={cn('text-xs font-mono', overallPnL >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {overallPnL >= 0 ? '+' : ''}{formatCurrency(overallPnL)} ({overallPct.toFixed(1)}%)
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {portfolio.assets.map((asset, i) => (
          <LivePortfolioAssetRow key={asset.assetId} asset={asset} index={i} />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/8 flex items-center justify-between">
        <Button size="sm" variant="glass" asChild>
          <a href="/marketplace">Explore Marketplace</a>
        </Button>
        <div className="text-xs text-muted-foreground">
          Total Invested: <span className="font-mono text-foreground">{formatCurrency(portfolio.totalInvested)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Profit Period Selector ───────────────────────────────────

function ProfitPeriodCard({ metrics }: { metrics: { dailyProfit: number; weeklyProfit: number; monthlyProfit: number } }) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  const values = {
    daily:   metrics.dailyProfit,
    weekly:  metrics.weeklyProfit,
    monthly: metrics.monthlyProfit,
  }
  return (
    <div className="gradient-border p-6 h-full" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-bold">Profit Tracker</h3>
        <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg border border-border">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-md transition-all duration-200 capitalize',
                period === p ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="text-center py-6">
        <motion.p
          key={period}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-display font-bold text-emerald-400 font-mono"
        >
          +{formatCurrency(values[period])}
        </motion.p>
        <p className="text-sm text-muted-foreground mt-2 capitalize">{period} profit</p>
      </div>
      <div className="space-y-3 mt-4">
        {[
          { label: 'Meta Ads', amount: values[period] * 0.42, color: CHANNEL_COLORS.META_ADS },
          { label: 'Google Ads', amount: values[period] * 0.28, color: CHANNEL_COLORS.GOOGLE_ADS },
          { label: 'WhatsApp', amount: values[period] * 0.18, color: CHANNEL_COLORS.WHATSAPP },
          { label: 'Other', amount: values[period] * 0.12, color: CHANNEL_COLORS.TIKTOK_ADS },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-muted-foreground flex-1">{item.label}</span>
            <span className="text-xs font-mono font-medium text-emerald-400">+{formatCurrency(item.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Withdrawal Modal ─────────────────────────────────────────

function WithdrawalModal({ onClose, availableBalance, userId }: { onClose: () => void; availableBalance: number; userId: string }) {
  const [amount, setAmount]             = useState('')
  const [method, setMethod]             = useState('BANK')
  const [accountDetails, setAccountDetails] = useState('')
  const [submitting, setSubmitting]     = useState(false)

  const handleSubmit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0)       { return }
    if (amt > availableBalance) { return }
    if (!accountDetails.trim()) { return }
    setSubmitting(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, addDoc, doc, setDoc, increment, serverTimestamp } = await import('firebase/firestore')
      const ref = await addDoc(collection(db, 'withdrawals'), {
        investorId: userId, amount: amt, method, accountDetails: accountDetails.trim(),
        status: 'PENDING', requestedAt: serverTimestamp(), processedAt: null, notes: null,
      })
      await setDoc(doc(db, 'user_flags', userId), { availableBalance: increment(-amt), userId }, { merge: true })
      await addDoc(collection(db, 'transactions'), {
        investorId: userId, type: 'WITHDRAWAL',
        description: `Withdrawal via ${method} — $${amt.toLocaleString()}`,
        amount: -amt, status: 'PENDING',
        reference: `WD-${ref.id.slice(0, 8).toUpperCase()}`,
        createdAt: serverTimestamp(),
      })
      onClose()
    } catch (e: any) {
      console.error(e)
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md gradient-border p-8 rounded-2xl"
        style={{ background: 'hsl(222 44% 8%)' }}
      >
        <h2 className="text-xl font-display font-bold mb-2">Request Withdrawal</h2>
        <p className="text-sm text-muted-foreground mb-6">Available balance: <span className="text-brand-400 font-mono">{formatCurrency(availableBalance)}</span></p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Amount (USD)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount..."
              className="w-full h-11 px-4 bg-background/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Account Details</label>
            <input value={accountDetails} onChange={e => setAccountDetails(e.target.value)}
              placeholder="IBAN / Phone / Account ID..."
              className="w-full h-11 px-4 bg-background/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Withdrawal Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}
              className="w-full h-11 px-4 bg-background/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 appearance-none">
              {['BANK', 'EASYPAISA', 'JAZZCASH', 'STRIPE'].map((m) => (
                <option key={m} value={m}>{m.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button className="flex-1 gap-2" onClick={handleSubmit}
              disabled={!amount || parseFloat(amount) <= 0 || !accountDetails.trim() || submitting}>
              {submitting ? <><div className="w-4 h-4 border-2 border-obsidian-950 border-t-transparent rounded-full animate-spin" /> Submitting…</> : <><ArrowDownToLine className="w-4 h-4" /> Submit Request</>}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────

export default function InvestorDashboard() {
  const { user } = useAuthStore()
  const [showWithdrawal, setShowWithdrawal] = useState(false)

  // ── Real Firestore data ───────────────────────────────────────
  const [realInvestments, setRealInvestments]   = useState<any[]>([])
  const [realBadges,      setRealBadges]         = useState<any[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [availableBalance, setAvailableBalance]  = useState(0)
  const [realMetrics, setRealMetrics] = useState({
    totalInvested: 0, currentValue: 0, netROI: 0, netROIPercent: 0, coinBalance: 0,
    dailyProfit: 0, weeklyProfit: 0, monthlyProfit: 0,
  })

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, query, where, getDocs, getDoc, doc } = await import('firebase/firestore')

        const [invSnap, badgeSnap, txSnap, flagSnap, wdSnap] = await Promise.all([
          getDocs(query(collection(db, 'investments'),  where('investorId', '==', user.id))),
          getDocs(query(collection(db, 'badges'),       where('userId',     '==', user.id))),
          getDocs(query(collection(db, 'transactions'), where('investorId', '==', user.id))).catch(() => null),
          getDoc(doc(db, 'user_flags', user.id)),
          getDocs(query(collection(db, 'withdrawals'),  where('investorId', '==', user.id))).catch(() => null),
        ])

        const invs = invSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
        setRealInvestments(invs)
        setRealBadges(badgeSnap.docs.map(d => ({ id: d.id, ...d.data() })))

        // Build recent activity: transactions + investment records
        const txList = txSnap
          ? txSnap.docs.map(d => {
              const data = d.data()
              return {
                id: d.id, type: data.type, amount: data.amount || 0,
                description: data.description || '',
                createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? new Date().toISOString(),
                coinAmount: data.coinAmount,
              }
            })
          : []

        // Also pull latest investment records as INVESTMENT type
        const invActivity = invs.slice(0, 3).map(inv => ({
          id: `inv_${inv.id}`,
          type: 'INVESTMENT',
          amount: -(inv.amount || 0),
          description: `Investment in ${inv.businessName || 'Business'}`,
          createdAt: inv.createdAt?.toDate?.()?.toISOString?.() ?? inv.createdAt ?? new Date().toISOString(),
        }))

        const allActivity = [...txList, ...invActivity]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
        setRecentTransactions(allActivity)

        // Compute metrics from approved investments
        const approved = invs.filter((i: any) => i.status === 'APPROVED' || i.status === 'PENDING')
        const totalInvested = approved.reduce((s: number, i: any) => s + (i.amount || 0), 0)
        const avgROI = approved.length > 0
          ? approved.reduce((s: number, i: any) => s + (i.expectedROI || 0), 0) / approved.length
          : 0
        const currentValue = totalInvested * (1 + avgROI / 100)
        const netROI = currentValue - totalInvested

        const flagData = flagSnap.exists() ? flagSnap.data() : {}
        const coinBalance = flagData?.coinBalance ?? flagData?.points ?? 0
        const balance = flagData?.availableBalance ?? 0
        setAvailableBalance(balance)

        setRealMetrics({
          totalInvested,
          currentValue,
          netROI,
          netROIPercent: totalInvested > 0 ? (netROI / totalInvested) * 100 : 0,
          coinBalance,
          dailyProfit:   netROI * 0.033,
          weeklyProfit:  netROI * 0.23,
          monthlyProfit: netROI,
        })
      } catch (e) {
        console.error('[InvestorDashboard] load error:', e)
      }
    }
    load()
  }, [user?.id])

  // Map real investments to the shape INVESTMENT_COLS expects
  const displayInvestments = realInvestments.map((inv: any) => ({
    id:           inv.id,
    name:         inv.businessName || 'Business',
    channel:      'META_ADS', // investment type mapped to channel for chart colours
    amount:       inv.amount || 0,
    currentValue: inv.amount || 0,
    profitLoss:   0,
    profitPercent:0,
    status:       inv.status || 'PENDING',
    startDate:    inv.createdAt?.toDate?.()?.toISOString?.().split('T')[0] ?? '',
  }))

  // Build 30-day performance from real investments
  const realPerformance = (() => {
    const approved = realInvestments.filter((i: any) => i.status === 'APPROVED')
    const now = Date.now()
    return Array.from({ length: 30 }, (_, idx) => {
      const dayTs = now - (29 - idx) * 86400000
      const cum = approved
        .filter((inv: any) => {
          const ts = inv.createdAt?.toDate?.()?.getTime?.() ?? new Date(inv.createdAt).getTime()
          return ts <= dayTs
        })
        .reduce((s: number, inv: any) => s + (inv.amount || 0), 0)
      return { date: new Date(dayTs).toISOString().split('T')[0], value: cum }
    })
  })()

  // Build portfolio allocation from real investments
  const realPortfolio = (() => {
    const active = realInvestments.filter((i: any) => i.status === 'APPROVED' || i.status === 'PENDING')
    if (active.length === 0) return []
    const groups: Record<string, number> = {}
    active.forEach((inv: any) => {
      const key = inv.businessName || inv.investmentType || 'Other'
      groups[key] = (groups[key] || 0) + (inv.amount || 0)
    })
    return Object.entries(groups).map(([name, value], i) => ({
      name,
      value,
      color: Object.values(CHANNEL_COLORS)[i % Object.values(CHANNEL_COLORS).length],
    }))
  })()

  return (
    <DashboardLayout
      role="INVESTOR"
      title="My Portfolio"
      subtitle="Track your investments, profits, and coins"
    >
      {/* Top Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Last updated: </span>
          <span className="text-xs text-brand-400 font-mono">{new Date().toLocaleTimeString()}</span>
        </div>
        <Button onClick={() => setShowWithdrawal(true)} className="gap-2">
          <ArrowDownToLine className="w-4 h-4" />
          Request Withdrawal
        </Button>
      </div>

      {/* Market Alerts Ticker */}
      <MarketAlertsTicker />

      {/* AI Insight Banner — shown only when user has investments */}
      {realInvestments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 flex items-center gap-3 p-4 rounded-xl border border-brand-500/20 bg-brand-500/5"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-brand-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Portfolio Summary</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You have <span className="text-brand-400 font-medium">{realInvestments.length} investment{realInvestments.length !== 1 ? 's' : ''}</span> totalling{' '}
              <span className="text-emerald-400 font-medium">{formatCurrency(realMetrics.totalInvested)}</span>.
              {realMetrics.netROI > 0 && (
                <> Current estimated return: <span className="text-emerald-400 font-medium">+{formatCurrency(realMetrics.netROI)}</span>.</>
              )}
            </p>
          </div>
          <Button size="icon-sm" variant="ghost" className="flex-shrink-0">
            <Info className="w-4 h-4" />
          </Button>
        </motion.div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Invested"
          value={realMetrics.totalInvested}
          format="currency"
          icon={Wallet}
          iconColor="text-brand-400"
          iconBg="bg-brand-500/10"
          index={0}
        />
        <MetricCard
          title="Current Value"
          value={realMetrics.currentValue}
          format="currency"
          icon={DollarSign}
          change={realMetrics.netROIPercent}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          index={1}
        />
        <MetricCard
          title="Net P&L"
          value={realMetrics.netROI}
          format="currency"
          icon={TrendingUp}
          change={realMetrics.netROIPercent}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          index={2}
        />
        <MetricCard
          title="Coin Balance"
          value={formatNumber(realMetrics.coinBalance)}
          icon={Coins}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
          description="across all channels"
          index={3}
        />
      </div>

      {/* Live Portfolio Section */}
      <LivePortfolioSection />

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold">Portfolio Value</h3>
              <p className="text-xs text-muted-foreground mt-0.5">30-day performance history</p>
            </div>
            <div className={cn('flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border', getPnLBg(realMetrics.netROIPercent))}>
              <TrendingUp className="w-3.5 h-3.5" />
              {realMetrics.netROIPercent >= 0 ? '+' : ''}{realMetrics.netROIPercent.toFixed(1)}% ROI
            </div>
          </div>
          <AreaChart data={realPerformance} height={220} color="#10b981" format="currency" />
        </div>

        {/* Profit Period Card */}
        <ProfitPeriodCard metrics={realMetrics} />
      </div>

      {/* Portfolio + Coins Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Portfolio Allocation */}
        <div className="gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <h3 className="font-display font-bold mb-1">Portfolio Allocation</h3>
          <p className="text-xs text-muted-foreground mb-6">Distribution across channels</p>
          <DonutChart
            data={realPortfolio}
            height={200}
            centerLabel="invested"
            centerValue={formatCurrency(realMetrics.totalInvested, 'USD', true)}
          />
        </div>

        {/* My Coins */}
        <div className="gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold">My Coins</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Earned through investments & activity</p>
            </div>
            <Button size="sm" variant="glass" asChild><a href="/investor/coins">View all</a></Button>
          </div>
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Coins className="w-7 h-7 text-amber-400" />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold font-mono text-amber-400">{formatNumber(realMetrics.coinBalance)}</p>
              <p className="text-xs text-muted-foreground mt-1">◈ coins balance</p>
            </div>
            <p className="text-xs text-muted-foreground">
              ≈ <span className="text-foreground font-medium">${(realMetrics.coinBalance * 0.01).toFixed(0)}</span> in platform credits
            </p>
            <Button size="sm" variant="glass" asChild className="mt-2"><a href="/investor/coins">Earn &amp; Redeem</a></Button>
          </div>
        </div>
      </div>

      {/* Investments Table */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold">Active Investments</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{displayInvestments.length} investments</p>
          </div>
        </div>
        <DataTable
          columns={INVESTMENT_COLS}
          data={displayInvestments}
          rowKey={(r) => r.id}
        />
      </div>

      {/* Transactions + Badges Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold">Recent Transactions</h3>
            <Button size="sm" variant="ghost" asChild><a href="/investor/transactions">View all</a></Button>
          </div>
          <div className="space-y-2">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Activity className="w-7 h-7 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No transactions yet</p>
              </div>
            ) : recentTransactions.map((tx, i) => {
              const config = TX_TYPE_CONFIG[tx.type] || TX_TYPE_CONFIG.DEPOSIT
              const TxIcon = config.icon
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors"
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', config.bg)}>
                    <TxIcon className={cn('w-4 h-4', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt, 'relative')}</p>
                  </div>
                  <span className={cn('font-mono text-sm font-semibold flex-shrink-0', config.color)}>
                    {tx.coinAmount
                      ? `+${tx.coinAmount} ◈`
                      : `${tx.amount >= 0 ? '+' : ''}${formatCurrency(Math.abs(tx.amount))}`}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Badges */}
        <div className="gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold">Achievement Badges</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {realBadges.length} earned
              </p>
            </div>
            <Button size="sm" variant="ghost" asChild><a href="/investor/badges">View all</a></Button>
          </div>
          {realBadges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Award className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No badges yet — get your first investment approved</p>
            </div>
          ) : (
          <div className="grid grid-cols-5 gap-4">
            {realBadges.slice(0, 5).map((badge: any, i) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                className="flex flex-col items-center gap-2"
                title={badge.name}
              >
                <div className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all',
                  badge.earned
                    ? 'border-amber-500/40 bg-amber-500/10'
                    : 'border-border/50 bg-muted/20 grayscale opacity-40',
                )}>
                  {badge.icon}
                </div>
                <p className="text-[10px] text-muted-foreground text-center leading-tight">{badge.name}</p>
              </motion.div>
            ))}
          </div>
          )}

          {/* Coins earned summary */}
          <div className="mt-6 p-4 glass-card rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Coins className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Total Coins Earned</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="text-amber-400 font-mono font-semibold">{formatNumber(realMetrics.coinBalance)}</span> points lifetime
              </p>
            </div>
            <Button size="sm" variant="glass" className="ml-auto flex-shrink-0">Redeem</Button>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawal && user && (
        <WithdrawalModal
          onClose={() => setShowWithdrawal(false)}
          availableBalance={availableBalance}
          userId={user.id}
        />
      )}
    </DashboardLayout>
  )
}
