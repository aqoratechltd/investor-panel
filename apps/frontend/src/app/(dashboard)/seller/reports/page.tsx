'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Download, TrendingUp, DollarSign,
  Users, BarChart3, FileSpreadsheet, File,
  Calendar, Filter, CheckCircle,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { AreaChart } from '@/components/charts/area-chart'
import { BarChart } from '@/components/charts/bar-chart'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'

const REPORT_TYPES = [
  {
    id: 'investment_performance',
    title: 'Investment Performance',
    desc: 'Detailed breakdown of all investment channels with P&L',
    icon: TrendingUp,
    color: 'text-brand-400 bg-brand-500/10',
    formats: ['PDF', 'Excel', 'CSV'],
  },
  {
    id: 'investor_summary',
    title: 'Investor Summary',
    desc: 'Complete list of investors with ROI and portfolio data',
    icon: Users,
    color: 'text-violet-400 bg-violet-500/10',
    formats: ['PDF', 'Excel', 'CSV'],
  },
  {
    id: 'financial_overview',
    title: 'Financial Overview',
    desc: 'Revenue, withdrawals, and net P&L overview',
    icon: DollarSign,
    color: 'text-emerald-400 bg-emerald-500/10',
    formats: ['PDF', 'Excel'],
  },
  {
    id: 'transaction_log',
    title: 'Transaction Log',
    desc: 'Full transaction history with timestamps and status',
    icon: FileText,
    color: 'text-amber-400 bg-amber-500/10',
    formats: ['Excel', 'CSV'],
  },
]

const RECENT_EXPORTS = [
  { id: '1', name: 'Investment Performance — Feb 2025', type: 'PDF', size: '1.2 MB', generatedAt: '2025-03-01T09:00:00Z', status: 'COMPLETED' },
  { id: '2', name: 'Investor Summary — Q1 2025', type: 'Excel', size: '840 KB', generatedAt: '2025-02-28T14:30:00Z', status: 'COMPLETED' },
  { id: '3', name: 'Transaction Log — Feb 2025', type: 'CSV', size: '320 KB', generatedAt: '2025-02-28T14:35:00Z', status: 'COMPLETED' },
  { id: '4', name: 'Financial Overview — Jan 2025', type: 'PDF', size: '980 KB', generatedAt: '2025-02-01T10:00:00Z', status: 'COMPLETED' },
]

const FORMAT_ICONS: Record<string, any> = {
  PDF: File,
  Excel: FileSpreadsheet,
  CSV: FileText,
}

const FORMAT_COLORS: Record<string, string> = {
  PDF: 'text-red-400 bg-red-500/10',
  Excel: 'text-emerald-400 bg-emerald-500/10',
  CSV: 'text-blue-400 bg-blue-500/10',
}

const PERF_TREND = Array.from({ length: 12 }, (_, i) => ({
  date: new Date(2025, i, 1).toISOString(),
  value: 150000 + Math.sin(i * 0.6) * 40000 + i * 15000,
}))

const CHANNEL_DATA = [
  { name: 'Meta Ads', value: 88000 },
  { name: 'TikTok', value: 12000 },
  { name: 'Google', value: 54000 },
  { name: 'WhatsApp', value: 36000 },
  { name: 'Other', value: -38000 },
]

export default function SellerReportsPage() {
  const [dateRange, setDateRange] = useState('30d')
  const [generating, setGenerating] = useState<string | null>(null)

  const handleGenerate = (reportId: string, format: string) => {
    setGenerating(`${reportId}-${format}`)
    setTimeout(() => setGenerating(null), 2000)
  }

  return (
    <DashboardLayout role="SELLER" title="Reports & Exports" subtitle="Generate and download detailed performance reports">

      {/* Date Range */}
      <div className="flex items-center gap-3 mb-8">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1 p-1 bg-obsidian-900/60 rounded-xl border border-border">
          {['7d', '30d', '90d', '1y', 'custom'].map(r => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                dateRange === r ? 'bg-obsidian-800 text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Preview Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        <div className="gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <h3 className="font-display font-bold mb-1">Portfolio Value Trend</h3>
          <p className="text-xs text-muted-foreground mb-6">Monthly performance overview for export period</p>
          <AreaChart data={PERF_TREND} height={180} color="#10b981" format="currency" />
        </div>
        <div className="gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <h3 className="font-display font-bold mb-1">Channel P&L Summary</h3>
          <p className="text-xs text-muted-foreground mb-6">Profit/loss by investment channel</p>
          <BarChart data={CHANNEL_DATA} height={180} color="#06b6d4" />
        </div>
      </div>

      {/* Report Types */}
      <div className="mb-10">
        <h3 className="font-display font-bold mb-1">Generate Reports</h3>
        <p className="text-xs text-muted-foreground mb-6">Select a report type and download format</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {REPORT_TYPES.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="gradient-border p-5"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}
            >
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
                        <button
                          key={fmt}
                          onClick={() => handleGenerate(report.id, fmt)}
                          disabled={!!generating}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            FORMAT_COLORS[fmt]
                          } border border-current/20 hover:opacity-80 disabled:opacity-50`}
                        >
                          {isGenerating
                            ? <CheckCircle className="w-3.5 h-3.5 animate-pulse" />
                            : <FmtIcon className="w-3.5 h-3.5" />
                          }
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
          <div className="divide-y divide-border">
            {RECENT_EXPORTS.map((exp, i) => {
              const FmtIcon = FORMAT_ICONS[exp.type]
              return (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${FORMAT_COLORS[exp.type]}`}>
                    <FmtIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{exp.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{exp.size} · {formatDate(exp.generatedAt)}</p>
                  </div>
                  <Button size="icon-sm" variant="ghost" className="h-8 w-8 flex-shrink-0">
                    <Download className="w-4 h-4" />
                  </Button>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
