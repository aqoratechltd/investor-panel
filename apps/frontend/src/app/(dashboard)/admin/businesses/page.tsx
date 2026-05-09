'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, CheckCircle2, Globe, EyeOff, X,
  DollarSign, TrendingUp, Users, BarChart3, Search,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { cn } from '@/lib/utils'

type Status = 'PUBLISHED' | 'DRAFT'

interface Business {
  id: string
  sellerId: string
  sellerName: string
  sellerEmail: string
  name: string
  tagline: string
  description: string
  category: string
  industry: string
  companySize: string
  founded: number
  country: string
  website: string
  investmentType: string
  riskLevel: string
  askingAmount: number
  minInvestment: number
  equityOffered: number
  expectedROI: number
  lockPeriod: number
  ttmRevenue: number
  ttmProfit: number
  lastMonthRevenue: number
  lastMonthProfit: number
  customers: number
  annualRecurringRevenue: number
  annualGrowthRate: number
  churnRate: number
  highlights: string[]
  status: Status
  createdAt: any
  viewCount: number
  interestedCount: number
}

const STATUS_CFG = {
  PUBLISHED: { label: 'Live',  icon: Globe,   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  DRAFT:     { label: 'Draft', icon: EyeOff,  color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
}

function fmt(n: number) {
  if (n >= 1_00_00_000) return `₨${(n / 1_00_00_000).toFixed(1)} Cr`
  if (n >= 1_00_000)    return `₨${(n / 1_00_000).toFixed(1)} L`
  if (n >= 1_000)       return `₨${(n / 1_000).toFixed(0)}K`
  return `₨${n.toLocaleString('en-PK')}`
}

function fmtDate(v: any) {
  if (!v) return '—'
  const d = v?.toDate ? v.toDate() : new Date(v)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Status | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Business | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, getDocs } = await import('firebase/firestore')
        const snap = await getDocs(collection(db, 'businesses'))
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Business)
        list.sort((a, b) => {
          const ta = (a.createdAt as any)?.toDate?.()?.getTime?.() ?? 0
          const tb = (b.createdAt as any)?.toDate?.()?.getTime?.() ?? 0
          return tb - ta
        })
        setBusinesses(list)
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = businesses.filter(b => {
    const matchFilter = filter === 'ALL' || b.status === filter
    const matchSearch = !search ||
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.sellerName?.toLowerCase().includes(search.toLowerCase()) ||
      b.category?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const counts = {
    ALL:       businesses.length,
    PUBLISHED: businesses.filter(b => b.status === 'PUBLISHED').length,
    DRAFT:     businesses.filter(b => b.status === 'DRAFT').length,
  }

  return (
    <DashboardLayout role="SUPER_ADMIN">
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display">Business Listings</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor all business listings across the platform. Sellers manage their own publish status.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total',     value: counts.ALL,       color: 'text-foreground' },
            { label: 'Live',      value: counts.PUBLISHED, color: 'text-emerald-400' },
            { label: 'Draft',     value: counts.DRAFT,     color: 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className="glass-card rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={cn('text-2xl font-bold font-display', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, seller, category…"
              className="w-full bg-obsidian-900 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20" />
          </div>
          <div className="flex gap-1 p-1 bg-obsidian-900/60 rounded-xl border border-border">
            {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize',
                  filter === f ? 'bg-obsidian-800 text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {f.toLowerCase()} ({counts[f]})
              </button>
            ))}
          </div>
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
              <p className="text-sm text-muted-foreground">No businesses found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">Business</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4 hidden md:table-cell">Seller</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4 hidden lg:table-cell">Asking</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4 hidden lg:table-cell">Views</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Status</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4 hidden sm:table-cell">Listed</th>
                    <th className="px-4 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((b, i) => {
                    const st = STATUS_CFG[b.status] ?? STATUS_CFG.DRAFT
                    return (
                      <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold">{b.name}</p>
                            <p className="text-xs text-muted-foreground">{b.category} · {b.country}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <p className="text-sm">{b.sellerName}</p>
                          <p className="text-xs text-muted-foreground">{b.sellerEmail}</p>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <p className="text-sm font-mono font-semibold text-brand-400">{fmt(b.askingAmount)}</p>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <p className="text-sm text-muted-foreground">{b.viewCount ?? 0}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', st.color, st.bg)}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 hidden sm:table-cell">
                          <p className="text-xs text-muted-foreground">{fmtDate(b.createdAt)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <button onClick={() => setSelected(b)}
                            className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">
                            View
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
              onClick={() => setSelected(null)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full w-full max-w-2xl bg-obsidian-950 border-l border-border z-50 overflow-y-auto">

              <div className="sticky top-0 bg-obsidian-950/90 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="font-bold font-display">{selected.name}</h2>
                  <p className="text-xs text-muted-foreground">{selected.sellerName} · {selected.sellerEmail}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border',
                    (STATUS_CFG[selected.status] ?? STATUS_CFG.DRAFT).color,
                    (STATUS_CFG[selected.status] ?? STATUS_CFG.DRAFT).bg)}>
                    {(STATUS_CFG[selected.status] ?? STATUS_CFG.DRAFT).label}
                  </span>
                  <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <section>
                  <p className="section-title mb-3">Overview</p>
                  <div className="glass-card rounded-xl p-4 space-y-3">
                    {selected.tagline && <p className="text-sm font-medium text-brand-300 italic">"{selected.tagline}"</p>}
                    <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      {[
                        { label: 'Category',     value: selected.category },
                        { label: 'Industry',     value: selected.industry },
                        { label: 'Company Size', value: selected.companySize },
                        { label: 'Founded',      value: selected.founded },
                        { label: 'Country',      value: selected.country },
                        { label: 'Website',      value: selected.website || '—' },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-xs text-muted-foreground">{f.label}</p>
                          <p className="text-sm font-medium truncate">{f.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section>
                  <p className="section-title mb-3">Financial Metrics</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'TTM Revenue',       value: fmt(selected.ttmRevenue),             color: 'text-emerald-400' },
                      { label: 'TTM Profit',         value: fmt(selected.ttmProfit),              color: 'text-emerald-400' },
                      { label: 'Last Month Revenue', value: fmt(selected.lastMonthRevenue),       color: 'text-brand-400' },
                      { label: 'Last Month Profit',  value: fmt(selected.lastMonthProfit),        color: 'text-brand-400' },
                      { label: 'Customers',          value: selected.customers?.toLocaleString(), color: 'text-violet-400' },
                      { label: 'ARR',                value: fmt(selected.annualRecurringRevenue), color: 'text-brand-400' },
                      { label: 'Annual Growth',      value: `${selected.annualGrowthRate}%`,      color: 'text-emerald-400' },
                      { label: 'Churn Rate',         value: `${selected.churnRate}%`,             color: 'text-amber-400' },
                    ].map(m => (
                      <div key={m.label} className="glass-card rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">{m.label}</p>
                        <p className={cn('text-sm font-bold font-mono mt-0.5', m.color)}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <p className="section-title mb-3">Investment Terms</p>
                  <div className="glass-card rounded-xl p-4 grid grid-cols-2 gap-4">
                    {[
                      { label: 'Asking Amount',   value: fmt(selected.askingAmount) },
                      { label: 'Min Investment',  value: fmt(selected.minInvestment) },
                      { label: 'Equity Offered',  value: `${selected.equityOffered}%` },
                      { label: 'Expected ROI',    value: `${selected.expectedROI}%` },
                      { label: 'Lock Period',     value: `${selected.lockPeriod} months` },
                      { label: 'Investment Type', value: selected.investmentType },
                      { label: 'Risk Level',      value: selected.riskLevel },
                    ].map(f => (
                      <div key={f.label}>
                        <p className="text-xs text-muted-foreground">{f.label}</p>
                        <p className="text-sm font-semibold">{f.value}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {selected.highlights?.length > 0 && (
                  <section>
                    <p className="section-title mb-3">Key Highlights</p>
                    <div className="space-y-2">
                      {selected.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          {h}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
