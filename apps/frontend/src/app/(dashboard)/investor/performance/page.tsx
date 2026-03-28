'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, BarChart3, DollarSign,
  Calendar, Activity,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MetricCard } from '@/components/ui/metric-card'
import { AreaChart } from '@/components/charts/area-chart'
import { BarChart } from '@/components/charts/bar-chart'
import { cn, formatCurrency, formatPercent, getPnLColor } from '@/lib/utils'

type Range = '7d' | '30d' | '90d' | '1y'

const genTrend = (len: number, base: number, growth: number) =>
  Array.from({ length: len }, (_, i) => ({
    date: new Date(2025, 2, i + 1).toISOString(),
    value: base + Math.sin(i * 0.4) * 2000 + i * growth,
  }))

const TREND_DATA: Record<Range, { date: string; value: number }[]> = {
  '7d': genTrend(7, 128000, 200),
  '30d': genTrend(30, 118000, 350),
  '90d': genTrend(90, 100000, 200),
  '1y': genTrend(12, 80000, 3000),
}

const MONTHLY_PNL = [
  { name: 'Oct', value: 1200 },
  { name: 'Nov', value: 2800 },
  { name: 'Dec', value: 1900 },
  { name: 'Jan', value: 3400 },
  { name: 'Feb', value: 4100 },
  { name: 'Mar', value: 2750 },
]

const PERFORMANCE_BREAKDOWN = [
  { period: 'Today', value: 240, pct: 0.19, positive: true },
  { period: 'This Week', value: 1420, pct: 1.13, positive: true },
  { period: 'This Month', value: 2750, pct: 2.19, positive: true },
  { period: 'Last Month', value: 4100, pct: 3.38, positive: true },
  { period: 'This Quarter', value: 8590, pct: 7.14, positive: true },
  { period: 'All Time', value: 16270, pct: 14.6, positive: true },
]

export default function InvestorPerformancePage() {
  const [range, setRange] = useState<Range>('30d')

  return (
    <DashboardLayout role="INVESTOR" title="Performance" subtitle="Detailed analysis of your investment performance">

      <div className="flex gap-1 p-1 bg-obsidian-900/60 rounded-xl w-fit mb-8 border border-border">
        {(['7d', '30d', '90d', '1y'] as Range[]).map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              range === r ? 'bg-obsidian-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Portfolio Value" value={130270} format="currency" icon={DollarSign} change={14.6} iconColor="text-brand-400" iconBg="bg-brand-500/10" index={0} />
        <MetricCard title="Total Profit" value={16270} format="currency" icon={TrendingUp} change={14.6} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" index={1} />
        <MetricCard title="ROI" value={14.6} format="number" icon={BarChart3} changeLabel="%" change={2.1} iconColor="text-violet-400" iconBg="bg-violet-500/10" index={2} />
        <MetricCard title="Monthly Avg. Return" value={2712} format="currency" icon={Activity} iconColor="text-amber-400" iconBg="bg-amber-500/10" index={3} />
      </div>

      {/* Main Chart */}
      <div className="gradient-border p-6 mb-8" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-bold">Portfolio Growth</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Total portfolio value over time</p>
          </div>
          <span className="text-sm text-emerald-400 font-mono font-semibold flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> +{formatPercent(14.6)} all time
          </span>
        </div>
        <AreaChart data={TREND_DATA[range]} height={240} color="#10b981" format="currency" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Period Breakdown */}
        <div className="gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <h3 className="font-display font-bold mb-6">Returns by Period</h3>
          <div className="space-y-1">
            {PERFORMANCE_BREAKDOWN.map((item, i) => (
              <motion.div
                key={item.period}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{item.period}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn('text-sm font-mono font-semibold', item.positive ? 'text-emerald-400' : 'text-red-400')}>
                    +{formatCurrency(item.value)}
                  </span>
                  <span className={cn('text-xs font-mono w-14 text-right', item.positive ? 'text-emerald-400' : 'text-red-400')}>
                    +{formatPercent(item.pct)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Monthly P&L Chart */}
        <div className="gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <h3 className="font-display font-bold mb-1">Monthly P&L</h3>
          <p className="text-xs text-muted-foreground mb-6">Profit generated per month</p>
          <BarChart data={MONTHLY_PNL} height={200} color="#10b981" />
        </div>
      </div>

      {/* AI Insight Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="gradient-border p-5 flex items-start gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(139,92,246,0.04) 100%)' }}
      >
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
          <Activity className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-300 mb-1">AI Performance Insight</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Based on your current portfolio performance and trend data, your{' '}
            <span className="text-foreground font-medium">projected profit next month is approximately +$3,200</span>{' '}
            (+2.5% estimated return). Meta Ads channel is your strongest performer at +11% ROI.
            Consider increasing allocation to WhatsApp Marketing which shows consistent 12% returns.
          </p>
        </div>
      </motion.div>
    </DashboardLayout>
  )
}
