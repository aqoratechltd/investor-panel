'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, Users, DollarSign,
  Activity, ArrowUpRight, Globe, Zap, Loader2,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MetricCard } from '@/components/ui/metric-card'
import { AreaChart } from '@/components/charts/area-chart'
import { BarChart } from '@/components/charts/bar-chart'
import { DonutChart } from '@/components/charts/donut-chart'
import { formatCurrency } from '@/lib/utils'

const RANGE_OPTIONS = ['7d', '30d', '90d', '1y'] as const
type Range = typeof RANGE_OPTIONS[number]

interface AnalyticsData {
  totalInvestments: number
  totalInvestors: number
  totalSellers: number
  totalWithdrawals: number
  investmentsByDay: { date: string; value: number }[]
  investmentsByBusiness: { name: string; value: number; investors: number }[]
  investmentsByCountry: { name: string; value: number; color: string }[]
  monthlyInvestments: { name: string; value: number }[]
}

const COUNTRY_COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#6b7280']

function rangeDays(range: Range): number {
  return range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365
}

export default function AdminAnalyticsPage() {
  const [range, setRange]     = useState<Range>('30d')
  const [data, setData]       = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, query, where, getDocs, orderBy, Timestamp } = await import('firebase/firestore')

        const days = rangeDays(range)
        const since = new Date(Date.now() - days * 86400000)
        const sinceTs = Timestamp.fromDate(since)

        const [invSnap, userSnap, wdSnap] = await Promise.all([
          // All investments in the period
          getDocs(query(
            collection(db, 'investments'),
            where('createdAt', '>=', sinceTs),
            orderBy('createdAt', 'asc'),
          )).catch(() => null),
          // All users
          getDocs(collection(db, 'users')).catch(() => null),
          // Completed withdrawals in period
          getDocs(query(
            collection(db, 'withdrawals'),
            where('requestedAt', '>=', sinceTs),
          )).catch(() => null),
        ])

        const investments = invSnap ? invSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[] : []
        const users       = userSnap ? userSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[] : []
        const withdrawals = wdSnap   ? wdSnap.docs.map(d => d.data())                            : []

        const totalInvestments  = investments.reduce((s: number, i: any) => s + (i.amount || 0), 0)
        const totalWithdrawals  = withdrawals.reduce((s: number, w: any) => s + (w.amount || 0), 0)
        const totalInvestors    = users.filter((u: any) => u.role === 'INVESTOR').length
        const totalSellers      = users.filter((u: any) => u.role === 'SELLER').length

        // Build day-by-day cumulative investment trend
        const dayMap = new Map<string, number>()
        for (let i = 0; i < days; i++) {
          const d = new Date(since.getTime() + i * 86400000)
          dayMap.set(d.toISOString().split('T')[0], 0)
        }
        investments.forEach((inv: any) => {
          const d = inv.createdAt?.toDate?.()?.toISOString?.().split('T')[0] ?? ''
          if (dayMap.has(d)) dayMap.set(d, (dayMap.get(d) || 0) + (inv.amount || 0))
        })
        // Running cumulative
        let cum = 0
        const investmentsByDay = Array.from(dayMap.entries()).map(([date, val]) => {
          cum += val
          return { date, value: cum }
        })

        // Top businesses by investment volume
        const bizMap = new Map<string, { name: string; value: number; investors: Set<string> }>()
        investments.forEach((inv: any) => {
          const key = inv.businessId || inv.businessName || 'Unknown'
          const name = inv.businessName || 'Unknown'
          if (!bizMap.has(key)) bizMap.set(key, { name, value: 0, investors: new Set() })
          const entry = bizMap.get(key)!
          entry.value += inv.amount || 0
          if (inv.investorId) entry.investors.add(inv.investorId)
        })
        const investmentsByBusiness = Array.from(bizMap.values())
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
          .map(b => ({ name: b.name, value: b.value, investors: b.investors.size }))

        // Country distribution from user profiles
        const countryMap = new Map<string, number>()
        users.forEach((u: any) => {
          const c = u.country || 'Other'
          countryMap.set(c, (countryMap.get(c) || 0) + 1)
        })
        const investmentsByCountry = Array.from(countryMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, value], i) => ({ name, value, color: COUNTRY_COLORS[i] || '#6b7280' }))

        // Monthly investment totals (last 6 calendar months)
        const monthMap = new Map<string, number>()
        const now = new Date()
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          monthMap.set(d.toLocaleString('en-US', { month: 'short' }), 0)
        }
        investments.forEach((inv: any) => {
          const d: Date = inv.createdAt?.toDate?.() ?? new Date(inv.createdAt)
          const key = d.toLocaleString('en-US', { month: 'short' })
          if (monthMap.has(key)) monthMap.set(key, (monthMap.get(key) || 0) + (inv.amount || 0))
        })
        const monthlyInvestments = Array.from(monthMap.entries()).map(([name, value]) => ({ name, value }))

        setData({
          totalInvestments, totalInvestors, totalSellers, totalWithdrawals,
          investmentsByDay, investmentsByBusiness, investmentsByCountry, monthlyInvestments,
        })
      } catch (e) {
        console.error('[Analytics] load error:', e)
      }
      setLoading(false)
    }
    load()
  }, [range])

  return (
    <DashboardLayout role="SUPER_ADMIN" title="Platform Analytics" subtitle="Real-time insights across the entire platform">

      {/* Range Picker */}
      <div className="flex gap-1 p-1 bg-obsidian-900/60 rounded-xl w-fit mb-8 border border-border">
        {RANGE_OPTIONS.map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${range === r ? 'bg-obsidian-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {r}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard title="Total Invested"    value={data?.totalInvestments ?? 0}  format="currency" icon={DollarSign} iconColor="text-brand-400"   iconBg="bg-brand-500/10"   index={0} />
            <MetricCard title="Active Sellers"    value={data?.totalSellers ?? 0}       format="number"   icon={Users}      iconColor="text-violet-400"  iconBg="bg-violet-500/10"  index={1} />
            <MetricCard title="Total Investors"   value={data?.totalInvestors ?? 0}     format="number"   icon={Activity}   iconColor="text-emerald-400" iconBg="bg-emerald-500/10" index={2} />
            <MetricCard title="Total Withdrawals" value={data?.totalWithdrawals ?? 0}   format="currency" icon={TrendingUp}  iconColor="text-amber-400"   iconBg="bg-amber-500/10"   index={3} />
          </div>

          {/* Investment Trend + Geo */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display font-bold">Investment Volume</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Cumulative investments over {range}</p>
                </div>
              </div>
              <AreaChart data={data?.investmentsByDay ?? []} height={220} color="#06b6d4" format="currency" />
            </div>

            <div className="gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
              <div className="flex items-center gap-2 mb-6">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-display font-bold">Geographic Distribution</h3>
              </div>
              {(data?.investmentsByCountry.length ?? 0) > 0 ? (
                <DonutChart
                  data={data?.investmentsByCountry ?? []}
                  height={180}
                  centerLabel="countries"
                  centerValue={String(data?.investmentsByCountry.length ?? 0)}
                />
              ) : (
                <div className="flex items-center justify-center h-44 text-sm text-muted-foreground">No geographic data yet</div>
              )}
            </div>
          </div>

          {/* Monthly Bar + Top Businesses */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
              <h3 className="font-display font-bold mb-1">Monthly Investment Volume</h3>
              <p className="text-xs text-muted-foreground mb-6">Last 6 months</p>
              <BarChart data={data?.monthlyInvestments ?? []} height={200} color="#8b5cf6" />
            </div>

            <div className="gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
              <h3 className="font-display font-bold mb-1">Top Businesses by Volume</h3>
              <p className="text-xs text-muted-foreground mb-6">Highest investment activity</p>
              {(data?.investmentsByBusiness.length ?? 0) === 0 ? (
                <div className="flex items-center justify-center h-44 text-sm text-muted-foreground">No investment data yet</div>
              ) : (
                <div className="space-y-4">
                  {data?.investmentsByBusiness.map((biz, i) => (
                    <motion.div key={biz.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-obsidian-800 flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{biz.name}</span>
                          <span className="text-sm font-mono font-semibold ml-2 flex-shrink-0">{formatCurrency(biz.value)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-obsidian-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${((biz.value / (data.investmentsByBusiness[0]?.value || 1)) * 100)}%` }}
                              transition={{ delay: 0.3 + i * 0.07, duration: 0.6 }}
                              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
                            />
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {biz.investors} investor{biz.investors !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Platform KPIs */}
          <div className="gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
            <h3 className="font-display font-bold mb-6">Platform KPIs</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Invested',    value: formatCurrency(data?.totalInvestments ?? 0, 'USD', true), sub: `Over ${range}`,                icon: DollarSign, color: 'text-brand-400',   bg: 'bg-brand-500/10' },
                { label: 'Avg/Investor',      value: data && data.totalInvestors > 0 ? formatCurrency(data.totalInvestments / data.totalInvestors, 'USD', true) : '$0', sub: 'Average investment size', icon: Zap,        color: 'text-amber-400',   bg: 'bg-amber-500/10' },
                { label: 'Withdrawal Rate',   value: data && data.totalInvestments > 0 ? `${((data.totalWithdrawals / data.totalInvestments) * 100).toFixed(1)}%` : '0%', sub: 'Of invested capital', icon: BarChart3,   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: 'Businesses Active', value: String(data?.investmentsByBusiness.length ?? 0), sub: 'Receiving investments',     icon: Activity,   color: 'text-violet-400', bg: 'bg-violet-500/10' },
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
        </>
      )}
    </DashboardLayout>
  )
}
