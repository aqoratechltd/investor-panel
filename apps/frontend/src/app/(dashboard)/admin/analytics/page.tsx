'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, Users, DollarSign,
  Activity, ArrowUpRight, Globe, Zap,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MetricCard } from '@/components/ui/metric-card'
import { AreaChart } from '@/components/charts/area-chart'
import { BarChart } from '@/components/charts/bar-chart'
import { DonutChart } from '@/components/charts/donut-chart'
import { formatCurrency } from '@/lib/utils'

const RANGE_OPTIONS = ['7d', '30d', '90d', '1y'] as const
type Range = typeof RANGE_OPTIONS[number]

const genTrend = (len: number, base: number, variance: number, growth: number) =>
  Array.from({ length: len }, (_, i) => ({
    date: new Date(2025, 2, i + 1).toISOString(),
    value: base + Math.sin(i * 0.4) * variance + i * growth,
  }))

const REVENUE_DATA: Record<Range, { date: string; value: number }[]> = {
  '7d': genTrend(7, 120000, 15000, 2000),
  '30d': genTrend(30, 110000, 20000, 1500),
  '90d': genTrend(90, 90000, 25000, 1000),
  '1y': genTrend(12, 80000, 30000, 8000),
}

const TOP_SELLERS = [
  { name: 'Alpha Investments', revenue: 28400, investors: 312, growth: 18.2 },
  { name: 'Growth Partners', revenue: 21600, investors: 245, growth: 12.4 },
  { name: 'Meta Profit Co.', revenue: 18900, investors: 198, growth: 9.8 },
  { name: 'Digital Ventures', revenue: 14200, investors: 156, growth: 7.1 },
  { name: 'Summit Capital', revenue: 11800, investors: 124, growth: 5.4 },
]

const GEO_DATA = [
  { name: 'Pakistan', value: 42, color: '#06b6d4' },
  { name: 'UAE', value: 18, color: '#8b5cf6' },
  { name: 'UK', value: 15, color: '#10b981' },
  { name: 'USA', value: 14, color: '#f59e0b' },
  { name: 'Other', value: 11, color: '#6b7280' },
]

const MONTHLY_BAR = [
  { name: 'Oct', value: 185000 },
  { name: 'Nov', value: 224000 },
  { name: 'Dec', value: 278000 },
  { name: 'Jan', value: 312000 },
  { name: 'Feb', value: 349000 },
  { name: 'Mar', value: 385000 },
]

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<Range>('30d')

  return (
    <DashboardLayout role="SUPER_ADMIN" title="Platform Analytics" subtitle="Deep insights across the entire platform">

      {/* Range Picker */}
      <div className="flex gap-1 p-1 bg-obsidian-900/60 rounded-xl w-fit mb-8 border border-border">
        {RANGE_OPTIONS.map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              range === r ? 'bg-obsidian-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Total Revenue" value={2840500} format="currency" icon={DollarSign} change={18.4} iconColor="text-brand-400" iconBg="bg-brand-500/10" index={0} />
        <MetricCard title="Active Sellers" value={298} format="number" icon={Users} change={7.2} iconColor="text-violet-400" iconBg="bg-violet-500/10" index={1} />
        <MetricCard title="Total Investors" value={14218} format="number" icon={Activity} change={12.1} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" index={2} />
        <MetricCard title="Avg. MRR/Seller" value={9530} format="currency" icon={TrendingUp} change={5.3} iconColor="text-amber-400" iconBg="bg-amber-500/10" index={3} />
      </div>

      {/* Revenue Trend + Geo */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold">Revenue Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Platform revenue over time</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> +18.4%
            </div>
          </div>
          <AreaChart data={REVENUE_DATA[range]} height={220} color="#06b6d4" format="currency" />
        </div>
        <div className="gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-display font-bold">Geographic Distribution</h3>
          </div>
          <DonutChart data={GEO_DATA} height={180} centerLabel="regions" centerValue="5" />
        </div>
      </div>

      {/* Monthly Revenue Bar + Top Sellers */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <h3 className="font-display font-bold mb-1">Monthly Revenue</h3>
          <p className="text-xs text-muted-foreground mb-6">Last 6 months revenue breakdown</p>
          <BarChart data={MONTHLY_BAR} height={200} color="#8b5cf6" />
        </div>

        <div className="gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <h3 className="font-display font-bold mb-1">Top Sellers by Revenue</h3>
          <p className="text-xs text-muted-foreground mb-6">Highest performing sellers this month</p>
          <div className="space-y-4">
            {TOP_SELLERS.map((seller, i) => (
              <motion.div
                key={seller.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center gap-3"
              >
                <div className="w-6 h-6 rounded-md bg-obsidian-800 flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{seller.name}</span>
                    <span className="text-sm font-mono font-semibold ml-2 flex-shrink-0">{formatCurrency(seller.revenue)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-obsidian-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(seller.revenue / TOP_SELLERS[0].revenue) * 100}%` }}
                        transition={{ delay: 0.3 + i * 0.07, duration: 0.6 }}
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
                      />
                    </div>
                    <span className="text-xs text-emerald-400 flex items-center gap-0.5 flex-shrink-0">
                      <ArrowUpRight className="w-3 h-3" />{seller.growth}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
        <h3 className="font-display font-bold mb-6">Platform KPIs</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Churn Rate', value: '2.4%', sub: 'Monthly seller churn', icon: TrendingUp, color: 'text-red-400', bg: 'bg-red-500/10' },
            { label: 'NPS Score', value: '72', sub: 'Net Promoter Score', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'LTV/CAC Ratio', value: '4.2x', sub: 'Lifetime value ratio', icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'ARR', value: formatCurrency(2840500 * 12, 'USD', true), sub: 'Annual recurring revenue', icon: DollarSign, color: 'text-brand-400', bg: 'bg-brand-500/10' },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${kpi.bg}`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-display font-bold font-mono">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
              <p className="text-xs text-muted-foreground/60">{kpi.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
