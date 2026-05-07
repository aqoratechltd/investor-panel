'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, XCircle, Clock, Eye, Download, Building2,
  DollarSign, Users, TrendingUp, ChevronRight, X, AlertTriangle,
  FileSpreadsheet, Mail, Phone, Globe, Calendar, BarChart3,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

interface SellerApplication {
  id: string
  fullName: string
  email: string
  phone: string
  companyName: string
  businessDescription: string
  industry: string
  website?: string
  companySize: string
  founded: string
  country: string
  ttmRevenue: string
  ttmProfit: string
  lastMonthRevenue: string
  lastMonthProfit: string
  customers: string
  annualRecurringRevenue: string
  annualGrowthRate: string
  churnRate: string
  plStatementUrl?: string
  plStatementName?: string
  status: ApplicationStatus
  submittedAt: Date
  reviewedAt?: Date
  rejectionReason?: string
}

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  APPROVED: { label: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  REJECTED: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
}

const FILTER_TABS: { label: string; value: ApplicationStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
]

function fmtCurrency(val: string) {
  const n = parseFloat(val)
  if (isNaN(n)) return val
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function AdminSellerApplicationsPage() {
  const [applications, setApplications] = useState<SellerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ApplicationStatus | 'ALL'>('PENDING')
  const [selected, setSelected] = useState<SellerApplication | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, getDocs } = await import('firebase/firestore')
        const snap = await getDocs(collection(db, 'seller_applications'))
        const apps: SellerApplication[] = snap.docs.map(d => {
          const data = d.data()
          return {
            ...data,
            id: d.id,
            submittedAt: data.submittedAt ? new Date(data.submittedAt) : new Date(),
            reviewedAt: data.reviewedAt ? new Date(data.reviewedAt) : undefined,
          } as SellerApplication
        })
        apps.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
        setApplications(apps)
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'ALL' ? applications : applications.filter(a => a.status === filter)

  const handleApprove = async (app: SellerApplication) => {
    setActionLoading(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc } = await import('firebase/firestore')
      const now = new Date()
      await updateDoc(doc(db, 'seller_applications', app.id), {
        status: 'APPROVED',
        reviewedAt: now.toISOString(),
      })
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'APPROVED', reviewedAt: now } : a))
      setSelected(prev => prev?.id === app.id ? { ...prev, status: 'APPROVED', reviewedAt: now } : prev)
      toast.success(`${app.fullName} approved.`)
    } catch (e: any) {
      toast.error('Approval failed: ' + e.message)
    }
    setActionLoading(false)
  }

  const handleReject = async (app: SellerApplication) => {
    if (!rejectReason.trim()) return
    setActionLoading(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc } = await import('firebase/firestore')
      const now = new Date()
      await updateDoc(doc(db, 'seller_applications', app.id), {
        status: 'REJECTED',
        rejectionReason: rejectReason.trim(),
        reviewedAt: now.toISOString(),
      })
      setApplications(prev => prev.map(a => a.id === app.id
        ? { ...a, status: 'REJECTED', rejectionReason: rejectReason.trim(), reviewedAt: now } : a))
      setSelected(prev => prev?.id === app.id
        ? { ...prev, status: 'REJECTED', rejectionReason: rejectReason.trim(), reviewedAt: now } : prev)
      setRejecting(false)
      setRejectReason('')
      toast.success(`${app.fullName} rejected.`)
    } catch (e: any) {
      toast.error('Reject failed: ' + e.message)
    }
    setActionLoading(false)
  }

  const counts = {
    ALL: applications.length,
    PENDING: applications.filter(a => a.status === 'PENDING').length,
    APPROVED: applications.filter(a => a.status === 'APPROVED').length,
    REJECTED: applications.filter(a => a.status === 'REJECTED').length,
  }

  return (
    <DashboardLayout role="SUPER_ADMIN">
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-display">Seller Applications</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and approve seller onboarding requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: counts.ALL, color: 'text-foreground' },
            { label: 'Pending', value: counts.PENDING, color: 'text-amber-400' },
            { label: 'Approved', value: counts.APPROVED, color: 'text-emerald-400' },
            { label: 'Rejected', value: counts.REJECTED, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="glass-card rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={cn('text-2xl font-bold font-display', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button key={tab.value} onClick={() => setFilter(tab.value)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                filter === tab.value
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent',
              )}>
              {tab.label} ({counts[tab.value]})
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Building2 className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No applications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">Applicant</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4 hidden md:table-cell">Company</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4 hidden lg:table-cell">TTM Revenue</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4 hidden lg:table-cell">Customers</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Status</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4 hidden sm:table-cell">Submitted</th>
                    <th className="px-4 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(app => {
                    const st = STATUS_CONFIG[app.status]
                    return (
                      <motion.tr key={app.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium">{app.fullName}</p>
                            <p className="text-xs text-muted-foreground">{app.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <div>
                            <p className="text-sm font-medium">{app.companyName}</p>
                            <p className="text-xs text-muted-foreground">{app.industry}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <p className="text-sm font-mono font-medium text-emerald-400">{fmtCurrency(app.ttmRevenue)}</p>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <p className="text-sm font-mono">{Number(app.customers).toLocaleString()}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', st.color, st.bg)}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 hidden sm:table-cell">
                          <p className="text-xs text-muted-foreground">{fmtDate(app.submittedAt)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <button onClick={() => { setSelected(app); setRejecting(false); setRejectReason('') }}
                            className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium">
                            Review <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => { setSelected(null); setRejecting(false); setRejectReason('') }} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full w-full max-w-2xl bg-obsidian-950 border-l border-border z-50 overflow-y-auto"
              style={{ backgroundImage: 'linear-gradient(180deg, #0a1628 0%, #0d1f36 50%, #0a1628 100%)' }}>

              <div className="sticky top-0 bg-obsidian-950/90 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="font-bold font-display">{selected.companyName}</h2>
                  <p className="text-xs text-muted-foreground">{selected.fullName} · {selected.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', STATUS_CONFIG[selected.status].color, STATUS_CONFIG[selected.status].bg)}>
                    {STATUS_CONFIG[selected.status].label}
                  </span>
                  <button onClick={() => { setSelected(null); setRejecting(false); setRejectReason('') }}
                    className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Contact Info */}
                <section>
                  <p className="section-title mb-3">Contact Information</p>
                  <div className="glass-card rounded-xl p-4 grid grid-cols-2 gap-4">
                    {[
                      { icon: Mail, label: 'Email', value: selected.email },
                      { icon: Phone, label: 'Phone', value: selected.phone },
                      { icon: Globe, label: 'Website', value: selected.website || '—' },
                      { icon: Calendar, label: 'Submitted', value: fmtDate(selected.submittedAt) },
                    ].map(f => (
                      <div key={f.label} className="flex items-start gap-2">
                        <f.icon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">{f.label}</p>
                          <p className="text-sm font-medium break-all">{f.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Business Details */}
                <section>
                  <p className="section-title mb-3">Business Details</p>
                  <div className="glass-card rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Industry', value: selected.industry },
                        { label: 'Company Size', value: selected.companySize },
                        { label: 'Founded', value: selected.founded },
                        { label: 'Country', value: selected.country },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-xs text-muted-foreground">{f.label}</p>
                          <p className="text-sm font-medium">{f.value}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Description</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selected.businessDescription}</p>
                    </div>
                  </div>
                </section>

                {/* Financial Metrics */}
                <section>
                  <p className="section-title mb-3">Financial Metrics</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: TrendingUp, label: 'TTM Revenue', value: fmtCurrency(selected.ttmRevenue), color: 'text-emerald-400' },
                      { icon: DollarSign, label: 'TTM Profit', value: fmtCurrency(selected.ttmProfit), color: 'text-emerald-400' },
                      { icon: BarChart3, label: 'Last Month Revenue', value: fmtCurrency(selected.lastMonthRevenue), color: 'text-brand-400' },
                      { icon: DollarSign, label: 'Last Month Profit', value: fmtCurrency(selected.lastMonthProfit), color: 'text-brand-400' },
                      { icon: Users, label: 'Customers', value: Number(selected.customers).toLocaleString(), color: 'text-violet-400' },
                      { icon: TrendingUp, label: 'ARR', value: fmtCurrency(selected.annualRecurringRevenue), color: 'text-brand-400' },
                      { icon: BarChart3, label: 'Annual Growth', value: `${selected.annualGrowthRate}%`, color: 'text-emerald-400' },
                      { icon: AlertTriangle, label: 'Churn Rate', value: `${selected.churnRate}%`, color: 'text-amber-400' },
                    ].map(m => (
                      <div key={m.label} className="glass-card rounded-xl p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                          <m.icon className={cn('w-4 h-4', m.color)} />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{m.label}</p>
                          <p className={cn('text-sm font-bold font-mono', m.color)}>{m.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* P&L Statement */}
                {selected.plStatementUrl && (
                  <section>
                    <p className="section-title mb-3">P&L Statement</p>
                    <a href={selected.plStatementUrl} target="_blank" rel="noopener noreferrer"
                      className="glass-card rounded-xl p-4 flex items-center gap-3 hover:bg-white/5 transition-colors group">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selected.plStatementName || 'P&L Statement'}</p>
                        <p className="text-xs text-muted-foreground">Click to download</p>
                      </div>
                      <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </a>
                  </section>
                )}

                {/* Rejection reason (if already rejected) */}
                {selected.status === 'REJECTED' && selected.rejectionReason && (
                  <section>
                    <p className="section-title mb-3">Rejection Reason</p>
                    <div className="glass-card rounded-xl p-4 border border-red-500/20 bg-red-500/5">
                      <p className="text-sm text-muted-foreground">{selected.rejectionReason}</p>
                    </div>
                  </section>
                )}

                {/* Actions */}
                {selected.status === 'PENDING' && (
                  <section className="pb-6">
                    {!rejecting ? (
                      <div className="flex gap-3">
                        <button onClick={() => handleApprove(selected)} disabled={actionLoading}
                          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/30 transition-all disabled:opacity-50">
                          <CheckCircle2 className="w-4 h-4" />
                          {actionLoading ? 'Processing…' : 'Approve Application'}
                        </button>
                        <button onClick={() => setRejecting(true)}
                          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-semibold hover:bg-red-500/30 transition-all">
                          <XCircle className="w-4 h-4" />
                          Reject Application
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Reason for rejection <span className="text-red-400">*</span></label>
                          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                            placeholder="Explain why the application is being rejected (visible to the applicant)…"
                            rows={3}
                            className="w-full bg-obsidian-900 border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-red-500/50 transition-colors placeholder:text-muted-foreground" />
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => handleReject(selected)} disabled={actionLoading || !rejectReason.trim()}
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-semibold hover:bg-red-500/30 transition-all disabled:opacity-50">
                            <XCircle className="w-4 h-4" />
                            {actionLoading ? 'Processing…' : 'Confirm Rejection'}
                          </button>
                          <button onClick={() => { setRejecting(false); setRejectReason('') }}
                            className="px-5 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {selected.status !== 'PENDING' && selected.reviewedAt && (
                  <p className="text-xs text-muted-foreground pb-6">
                    Reviewed on {fmtDate(selected.reviewedAt)}
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
