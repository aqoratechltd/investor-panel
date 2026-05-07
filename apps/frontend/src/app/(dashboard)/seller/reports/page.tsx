'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Download, TrendingUp, DollarSign,
  Users, BarChart3, FileSpreadsheet, File,
  Calendar, CheckCircle, Loader2,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { AreaChart } from '@/components/charts/area-chart'
import { BarChart } from '@/components/charts/bar-chart'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'

const REPORT_TYPES = [
  { id: 'investment_performance', title: 'Investment Performance', desc: 'Detailed breakdown of all investment channels with P&L', icon: TrendingUp, color: 'text-brand-400 bg-brand-500/10', formats: ['PDF', 'Excel', 'CSV'] },
  { id: 'investor_summary',       title: 'Investor Summary',       desc: 'Complete list of investors with ROI and portfolio data', icon: Users,      color: 'text-violet-400 bg-violet-500/10', formats: ['PDF', 'Excel', 'CSV'] },
  { id: 'financial_overview',     title: 'Financial Overview',     desc: 'Revenue, withdrawals, and net P&L overview',             icon: DollarSign, color: 'text-emerald-400 bg-emerald-500/10', formats: ['PDF', 'Excel'] },
  { id: 'transaction_log',        title: 'Transaction Log',        desc: 'Full transaction history with timestamps and status',    icon: FileText,   color: 'text-amber-400 bg-amber-500/10',   formats: ['Excel', 'CSV'] },
]

const FORMAT_ICONS: Record<string, any>   = { PDF: File, Excel: FileSpreadsheet, CSV: FileText }
const FORMAT_COLORS: Record<string, string> = {
  PDF:   'text-red-400 bg-red-500/10',
  Excel: 'text-emerald-400 bg-emerald-500/10',
  CSV:   'text-blue-400 bg-blue-500/10',
}

interface Export {
  id: string
  name: string
  type: string
  generatedAt: string
}

export default function SellerReportsPage() {
  const { user } = useAuthStore()
  const [dateRange, setDateRange]     = useState('30d')
  const [generating, setGenerating]   = useState<string | null>(null)
  const [recentExports, setRecentExports] = useState<Export[]>([])
  const [loadingExports, setLoadingExports] = useState(true)

  // Chart data derived from real investments
  const [perfTrend, setPerfTrend]   = useState<{ date: string; value: number }[]>([])
  const [channelData, setChannelData] = useState<{ name: string; value: number }[]>([])
  const [loadingCharts, setLoadingCharts] = useState(true)

  // Load real investment data for charts + export history
  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, query, where, getDocs, orderBy, Timestamp } = await import('firebase/firestore')

        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365
        const since = new Date(Date.now() - days * 86400000)

        const [invSnap, exportSnap] = await Promise.all([
          // Investments where this seller's businesses are involved
          getDocs(query(
            collection(db, 'investments'),
            where('sellerId', '==', user.id),
            where('createdAt', '>=', Timestamp.fromDate(since)),
            orderBy('createdAt', 'asc'),
          )).catch(() => null),
          // Export history
          getDocs(query(
            collection(db, 'report_exports'),
            where('sellerId', '==', user.id),
            orderBy('createdAt', 'desc'),
          )).catch(() => null),
        ])

        // Build day-by-day cumulative trend
        const dayMap = new Map<string, number>()
        for (let i = 0; i < days; i++) {
          const d = new Date(since.getTime() + i * 86400000)
          dayMap.set(d.toISOString().split('T')[0], 0)
        }
        const investments = invSnap ? invSnap.docs.map(d => d.data()) as any[] : []
        investments.forEach((inv: any) => {
          const d = inv.createdAt?.toDate?.()?.toISOString?.().split('T')[0] ?? ''
          if (dayMap.has(d)) dayMap.set(d, (dayMap.get(d) || 0) + (inv.amount || 0))
        })
        let cum = 0
        setPerfTrend(Array.from(dayMap.entries()).map(([date, val]) => { cum += val; return { date, value: cum } }))

        // Channel breakdown by businessName
        const channelMap = new Map<string, number>()
        investments.forEach((inv: any) => {
          const key = inv.businessName || 'Other'
          channelMap.set(key, (channelMap.get(key) || 0) + (inv.amount || 0))
        })
        setChannelData(Array.from(channelMap.entries()).map(([name, value]) => ({ name, value })))

        // Export history
        const exports: Export[] = exportSnap
          ? exportSnap.docs.map(d => {
              const data = d.data()
              return {
                id: d.id,
                name: data.name || 'Report',
                type: data.type || 'PDF',
                generatedAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? new Date().toISOString(),
              }
            })
          : []
        setRecentExports(exports)
      } catch (e) {
        console.error('[Reports] load error:', e)
      }
      setLoadingCharts(false)
      setLoadingExports(false)
    }
    load()
  }, [user?.id, dateRange])

  const handleGenerate = async (reportId: string, format: string) => {
    if (!user?.id) return
    const key = `${reportId}-${format}`
    setGenerating(key)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
      const reportType = REPORT_TYPES.find(r => r.id === reportId)
      const name = `${reportType?.title ?? reportId} — ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
      const ref = await addDoc(collection(db, 'report_exports'), {
        sellerId: user.id,
        name,
        type: format,
        reportId,
        dateRange,
        createdAt: serverTimestamp(),
      })
      setRecentExports(prev => [{
        id: ref.id,
        name,
        type: format,
        generatedAt: new Date().toISOString(),
      }, ...prev])
    } catch (e) {
      console.error('[Reports] generate error:', e)
    }
    setGenerating(null)
  }

  return (
    <DashboardLayout role="SELLER" title="Reports & Exports" subtitle="Generate and download detailed performance reports">

      {/* Date Range */}
      <div className="flex items-center gap-3 mb-8">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1 p-1 bg-obsidian-900/60 rounded-xl border border-border">
          {['7d', '30d', '90d', '1y'].map(r => (
            <button key={r} onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${dateRange === r ? 'bg-obsidian-800 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        <div className="gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <h3 className="font-display font-bold mb-1">Investment Volume Trend</h3>
          <p className="text-xs text-muted-foreground mb-6">Cumulative investments over {dateRange}</p>
          {loadingCharts ? (
            <div className="flex items-center justify-center h-44"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
          ) : perfTrend.length > 0 ? (
            <AreaChart data={perfTrend} height={180} color="#10b981" format="currency" />
          ) : (
            <div className="flex items-center justify-center h-44 text-sm text-muted-foreground">No investment data for this period</div>
          )}
        </div>

        <div className="gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <h3 className="font-display font-bold mb-1">Investment by Business</h3>
          <p className="text-xs text-muted-foreground mb-6">Volume breakdown per business</p>
          {loadingCharts ? (
            <div className="flex items-center justify-center h-44"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
          ) : channelData.length > 0 ? (
            <BarChart data={channelData} height={180} color="#06b6d4" />
          ) : (
            <div className="flex items-center justify-center h-44 text-sm text-muted-foreground">No investment data for this period</div>
          )}
        </div>
      </div>

      {/* Report Types */}
      <div className="mb-10">
        <h3 className="font-display font-bold mb-1">Generate Reports</h3>
        <p className="text-xs text-muted-foreground mb-6">Select a report type and download format</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {REPORT_TYPES.map((report, i) => (
            <motion.div key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="gradient-border p-5"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${report.color}`}>
                  <report.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{report.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">{report.desc}</p>
                  <div className="flex gap-2 flex-wrap">
                    {report.formats.map(fmt => {
                      const FmtIcon = FORMAT_ICONS[fmt]
                      const isGenerating = generating === `${report.id}-${fmt}`
                      return (
                        <button key={fmt} onClick={() => handleGenerate(report.id, fmt)}
                          disabled={!!generating}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${FORMAT_COLORS[fmt]} border border-current/20 hover:opacity-80 disabled:opacity-50`}>
                          {isGenerating
                            ? <CheckCircle className="w-3.5 h-3.5 animate-pulse" />
                            : <FmtIcon className="w-3.5 h-3.5" />}
                          {isGenerating ? 'Generating...' : fmt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Exports */}
      <div>
        <h3 className="font-display font-bold mb-5">Recent Exports</h3>
        <div className="gradient-border overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
          {loadingExports ? (
            <div className="flex items-center justify-center h-24"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
          ) : recentExports.length === 0 ? (
            <div className="py-14 text-center">
              <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No exports yet — generate your first report above</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentExports.map((exp, i) => {
                const FmtIcon = FORMAT_ICONS[exp.type] ?? FileText
                return (
                  <motion.div key={exp.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${FORMAT_COLORS[exp.type] || 'text-muted-foreground bg-muted/20'}`}>
                      <FmtIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{exp.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{exp.type} · {formatDate(exp.generatedAt)}</p>
                    </div>
                    <Button size="icon-sm" variant="ghost" className="h-8 w-8 flex-shrink-0">
                      <Download className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
