'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Download, TrendingUp, DollarSign,
  Users, BarChart3, FileSpreadsheet, File,
  Calendar, Loader2,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { AreaChart } from '@/components/charts/area-chart'
import { BarChart } from '@/components/charts/bar-chart'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import toast from 'react-hot-toast'

const REPORT_TYPES = [
  { id: 'investment_performance', title: 'Investment Performance', desc: 'Detailed breakdown of all investment channels with P&L', icon: TrendingUp, color: 'text-brand-400 bg-brand-500/10', formats: ['PDF', 'Excel', 'CSV'] },
  { id: 'investor_summary',       title: 'Investor Summary',       desc: 'Complete list of investors with ROI and portfolio data', icon: Users,      color: 'text-violet-400 bg-violet-500/10', formats: ['PDF', 'Excel', 'CSV'] },
  { id: 'financial_overview',     title: 'Financial Overview',     desc: 'Revenue, withdrawals, and net P&L overview',             icon: DollarSign, color: 'text-emerald-400 bg-emerald-500/10', formats: ['PDF', 'Excel'] },
  { id: 'transaction_log',        title: 'Transaction Log',        desc: 'Full transaction history with timestamps and status',    icon: FileText,   color: 'text-amber-400 bg-amber-500/10',   formats: ['Excel', 'CSV'] },
]

const FORMAT_ICONS: Record<string, any>    = { PDF: File, Excel: FileSpreadsheet, CSV: FileText }
const FORMAT_COLORS: Record<string, string> = {
  PDF:   'text-red-400 bg-red-500/10',
  Excel: 'text-emerald-400 bg-emerald-500/10',
  CSV:   'text-blue-400 bg-blue-500/10',
}

interface Export { id: string; name: string; type: string; generatedAt: string }

// ── Download helpers ────────────────────────────────────────────────────────
function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

async function downloadExcel(filename: string, sheetName: string, rows: string[][]) {
  try {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.aoa_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, filename)
  } catch {
    // Fallback to CSV if xlsx fails
    downloadCSV(filename.replace('.xlsx', '.csv'), rows)
  }
}

function downloadPDF(title: string, rows: string[][], headers: string[]) {
  const html = `<!DOCTYPE html><html><head><title>${title}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  p  { color: #666; font-size: 12px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #f3f4f6; padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb; }
  td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }
</style></head><body>
<h1>${title}</h1>
<p>Generated on ${new Date().toLocaleString()}</p>
<table>
  <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
</table>
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script>
</body></html>`
  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close() }
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function SellerReportsPage() {
  const { user } = useAuthStore()
  const [dateRange, setDateRange]       = useState('30d')
  const [generating, setGenerating]     = useState<string | null>(null)
  const [recentExports, setRecentExports] = useState<Export[]>([])
  const [loadingExports, setLoadingExports] = useState(true)
  const [perfTrend, setPerfTrend]       = useState<{ date: string; value: number }[]>([])
  const [channelData, setChannelData]   = useState<{ name: string; value: number }[]>([])
  const [loadingCharts, setLoadingCharts] = useState(true)
  const [investments, setInvestments]   = useState<any[]>([])

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, query, where, getDocs } = await import('firebase/firestore')

        const days  = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365
        const since = new Date(Date.now() - days * 86400000)

        const [invSnap, exportSnap] = await Promise.all([
          getDocs(query(collection(db, 'investments'), where('sellerId', '==', user.id))).catch(() => null),
          getDocs(query(collection(db, 'report_exports'), where('sellerId', '==', user.id))).catch(() => null),
        ])

        const allInvs = invSnap ? invSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[] : []
        const filtered = allInvs.filter(inv => {
          const d = inv.createdAt?.toDate?.() ?? new Date(inv.createdAt ?? 0)
          return d >= since
        })
        setInvestments(allInvs)

        // Day-by-day cumulative trend
        const dayMap = new Map<string, number>()
        for (let i = 0; i < days; i++) {
          const d = new Date(since.getTime() + i * 86400000)
          dayMap.set(d.toISOString().split('T')[0], 0)
        }
        filtered.forEach((inv: any) => {
          const d = inv.createdAt?.toDate?.()?.toISOString?.().split('T')[0] ?? ''
          if (dayMap.has(d)) dayMap.set(d, (dayMap.get(d) || 0) + (inv.amount || 0))
        })
        let cum = 0
        setPerfTrend(Array.from(dayMap.entries()).map(([date, val]) => { cum += val; return { date, value: cum } }))

        // By business
        const channelMap = new Map<string, number>()
        filtered.forEach((inv: any) => {
          const key = inv.businessName || 'Other'
          channelMap.set(key, (channelMap.get(key) || 0) + (inv.amount || 0))
        })
        setChannelData(Array.from(channelMap.entries()).map(([name, value]) => ({ name, value })))

        const exports: Export[] = exportSnap
          ? exportSnap.docs.map(d => {
              const data = d.data()
              return { id: d.id, name: data.name || 'Report', type: data.type || 'PDF', generatedAt: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString() }
            }).sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
          : []
        setRecentExports(exports)
      } catch (e) { console.error('[Reports]', e) }
      setLoadingCharts(false)
      setLoadingExports(false)
    }
    load()
  }, [user?.id, dateRange])

  const handleGenerate = async (reportId: string, format: string) => {
    if (!user?.id) return
    const key = `${reportId}-${format}`
    setGenerating(key)
    toast.loading('Generating report…', { id: key })

    try {
      const reportType = REPORT_TYPES.find(r => r.id === reportId)!
      const dateStr    = new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
      const filename   = `${reportType.title.replace(/ /g, '_')}_${dateStr}`
      const title      = `${reportType.title} — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`

      let rows: string[][] = []
      let headers: string[] = []

      if (reportId === 'investment_performance') {
        headers = ['Date', 'Business', 'Investor', 'Amount ($)', 'Equity (%)', 'Expected ROI (%)', 'Payment Method', 'Status']
        rows = investments.map(inv => [
          inv.createdAt?.toDate?.()?.toLocaleDateString('en-GB') ?? '',
          inv.businessName ?? '',
          inv.investorName ?? '',
          (inv.amount ?? 0).toFixed(2),
          (inv.equityOffered ?? 0).toString(),
          (inv.expectedROI ?? 0).toString(),
          inv.paymentMethod ?? 'WALLET',
          inv.status ?? '',
        ])
      } else if (reportId === 'investor_summary') {
        const map = new Map<string, any>()
        investments.forEach(inv => {
          const id = inv.investorId || inv.investorName
          if (!map.has(id)) map.set(id, { name: inv.investorName, email: inv.investorEmail, total: 0, count: 0, roi: inv.expectedROI ?? 0 })
          map.get(id).total += inv.amount ?? 0
          map.get(id).count++
        })
        headers = ['Investor', 'Email', 'Total Invested ($)', 'Investments', 'Avg Expected ROI (%)']
        rows = Array.from(map.values()).map(v => [v.name, v.email, v.total.toFixed(2), v.count.toString(), v.roi.toString()])
      } else if (reportId === 'financial_overview') {
        const total   = investments.reduce((s, i) => s + (i.amount ?? 0), 0)
        const approved = investments.filter(i => i.status === 'APPROVED').reduce((s, i) => s + (i.amount ?? 0), 0)
        const pending  = investments.filter(i => i.status === 'PENDING_CONFIRMATION').reduce((s, i) => s + (i.amount ?? 0), 0)
        headers = ['Metric', 'Value']
        rows = [
          ['Total Investments', `$${total.toFixed(2)}`],
          ['Confirmed Investments', `$${approved.toFixed(2)}`],
          ['Pending Confirmation', `$${pending.toFixed(2)}`],
          ['Total Investors', new Set(investments.map(i => i.investorId)).size.toString()],
          ['Businesses Listed', new Set(investments.map(i => i.businessId)).size.toString()],
          ['Report Period', dateRange],
          ['Generated At', new Date().toLocaleString()],
        ]
      } else if (reportId === 'transaction_log') {
        headers = ['Date', 'Business', 'Investor', 'Amount ($)', 'Method', 'Status', 'Investment ID']
        rows = investments.map(inv => [
          inv.createdAt?.toDate?.()?.toLocaleString('en-GB') ?? '',
          inv.businessName ?? '',
          inv.investorName ?? '',
          (inv.amount ?? 0).toFixed(2),
          inv.paymentMethod ?? 'WALLET',
          inv.status ?? '',
          inv.id ?? '',
        ])
      }

      if (format === 'CSV') {
        downloadCSV(`${filename}.csv`, [headers, ...rows])
      } else if (format === 'Excel') {
        await downloadExcel(`${filename}.xlsx`, reportType.title, [headers, ...rows])
      } else if (format === 'PDF') {
        downloadPDF(title, rows, headers)
      }

      // Log export to Firestore
      const { db } = await import('@/lib/firebase')
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
      const name = `${reportType.title} — ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
      const ref  = await addDoc(collection(db, 'report_exports'), { sellerId: user.id, name, type: format, reportId, dateRange, createdAt: serverTimestamp() })
      setRecentExports(prev => [{ id: ref.id, name, type: format, generatedAt: new Date().toISOString() }, ...prev])
      toast.success(`${format} report downloaded!`, { id: key })
    } catch (e) {
      console.error('[Reports] generate error:', e)
      toast.error('Failed to generate report', { id: key })
    }
    setGenerating(null)
  }

  return (
    <DashboardLayout role="SELLER" title="Reports & Exports" subtitle="Generate and download detailed performance reports">

      {/* Date Range */}
      <div className="p-6 lg:p-8 space-y-10">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-1 p-1 bg-obsidian-900/60 rounded-xl border border-border">
            {['7d', '30d', '90d', '1y'].map(r => (
              <button key={r} onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${dateRange === r ? 'bg-obsidian-800 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-display font-bold mb-1">Investment Volume Trend</h3>
            <p className="text-xs text-muted-foreground mb-6">Cumulative investments over {dateRange}</p>
            {loadingCharts ? (
              <div className="flex items-center justify-center h-44"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
            ) : perfTrend.some(p => p.value > 0) ? (
              <AreaChart data={perfTrend} height={180} color="#10b981" format="currency" />
            ) : (
              <div className="flex items-center justify-center h-44 text-sm text-muted-foreground">No investment data for this period</div>
            )}
          </div>

          <div className="glass-card rounded-2xl p-6">
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

        {/* Report types */}
        <div>
          <h3 className="font-display font-bold mb-1">Generate Reports</h3>
          <p className="text-xs text-muted-foreground mb-6">Select a report type and download format — files download instantly</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {REPORT_TYPES.map((report, i) => (
              <motion.div key={report.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="glass-card rounded-2xl p-5">
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
                            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FmtIcon className="w-3.5 h-3.5" />}
                            {isGenerating ? 'Generating…' : fmt}
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

        {/* Recent exports */}
        <div>
          <h3 className="font-display font-bold mb-5">Recent Exports</h3>
          <div className="glass-card rounded-2xl overflow-hidden">
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
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${FORMAT_COLORS[exp.type] || 'text-muted-foreground bg-muted/20'}`}>
                        <FmtIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{exp.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{exp.type} · {formatDate(exp.generatedAt)}</p>
                      </div>
                      <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-white/5">{exp.type}</span>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
