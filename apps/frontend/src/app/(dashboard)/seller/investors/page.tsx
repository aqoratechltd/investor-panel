'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Users, DollarSign, TrendingUp, Clock, CheckCircle2, XCircle, Loader2,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuthStore } from '@/stores/auth.store'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Investment {
  id: string
  investorId: string
  investorName: string
  investorEmail: string
  businessName: string
  amount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: any
  equityOffered?: number
  expectedROI?: number
  lockPeriod?: number
}

const STATUS_CFG: Record<string, { label: string; Icon: any; color: string; bg: string }> = {
  PENDING:              { label: 'Pending',     Icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  PENDING_CONFIRMATION: { label: 'Confirming',  Icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  APPROVED:             { label: 'Approved',    Icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  REJECTED:             { label: 'Rejected',    Icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
}
const DEFAULT_STATUS_CFG = STATUS_CFG.PENDING

type Filter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

function fmt(n: number) {
  if (n >= 1_00_00_000) return `₨${(n / 1_00_00_000).toFixed(1)} Cr`
  if (n >= 1_00_000)    return `₨${(n / 1_00_000).toFixed(1)} L`
  if (n >= 1_000)       return `₨${(n / 1_000).toFixed(0)}K`
  return `₨${n.toLocaleString('en-PK')}`
}

function fmtDate(v: any) {
  if (!v) return '—'
  const d = v?.toDate ? v.toDate() : new Date(v)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SellerInvestorsPage() {
  const { user } = useAuthStore()
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filter, setFilter]           = useState<Filter>('ALL')

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, query, where, getDocs } = await import('firebase/firestore')
        const q = query(collection(db, 'investments'), where('sellerId', '==', user.id))
        const snap = await getDocs(q)
        setInvestments(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Investment))
      } catch (e) {
        console.error(e)
        toast.error('Failed to load investors')
      }
      setLoading(false)
    }
    load()
  }, [user?.id])

  const filtered = investments.filter(inv => {
    const matchStatus = filter === 'ALL' || inv.status === filter
    const matchSearch = !search ||
      inv.investorName.toLowerCase().includes(search.toLowerCase()) ||
      inv.investorEmail?.toLowerCase().includes(search.toLowerCase()) ||
      inv.businessName?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const totalReceived = investments.filter(i => i.status === 'APPROVED').reduce((s, i) => s + i.amount, 0)
  const approved      = investments.filter(i => i.status === 'APPROVED').length
  const pending       = investments.filter(i => i.status === 'PENDING').length

  // Unique investor count
  const uniqueInvestors = new Set(investments.filter(i => i.status === 'APPROVED').map(i => i.investorId)).size

  return (
    <DashboardLayout role="SELLER" title="Investors" subtitle="Track investments received for your businesses">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Investors', value: uniqueInvestors, format: 'number', icon: Users,        color: 'text-brand-400',   bg: 'bg-brand-500/10' },
          { label: 'Capital Raised',  value: totalReceived,   format: 'money',  icon: DollarSign,   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Approved',        value: approved,        format: 'number', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Pending Review',  value: pending,         format: 'number', icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/10' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', s.bg)}>
              <s.icon className={cn('w-5 h-5', s.color)} />
            </div>
            <div>
              <p className={cn('text-xl font-bold font-display font-mono', s.color)}>
                {s.format === 'money' ? fmt(s.value) : s.value}
              </p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search investor or business…"
            className="w-full bg-obsidian-900 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all" />
        </div>
        <div className="flex gap-1 p-1 bg-obsidian-900/60 rounded-xl border border-border">
          {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize',
                filter === f ? 'bg-obsidian-800 text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {f.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
            <Users className="w-8 h-8 text-brand-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold">{search || filter !== 'ALL' ? 'No results found' : 'No investors yet'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search || filter !== 'ALL' ? 'Try adjusting your search or filter' : 'Investors will appear here once they submit requests'}
            </p>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">Investor</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4 hidden md:table-cell">Business</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Amount</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4 hidden lg:table-cell">ROI / Lock</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Status</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4 hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((inv, i) => {
                  const st = STATUS_CFG[inv.status] ?? DEFAULT_STATUS_CFG
                  return (
                    <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-brand-400">
                            {inv.investorName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{inv.investorName}</p>
                            <p className="text-xs text-muted-foreground">{inv.investorEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <p className="text-sm text-muted-foreground">{inv.businessName}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-mono font-semibold text-brand-400">{fmt(inv.amount)}</p>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <p className="text-xs text-muted-foreground">
                          {inv.expectedROI ? `${inv.expectedROI}% ROI` : '—'}
                          {inv.lockPeriod ? ` · ${inv.lockPeriod}mo lock` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border', st.color, st.bg)}>
                          <st.Icon className="w-3 h-3" />{st.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <p className="text-xs text-muted-foreground">{fmtDate(inv.createdAt)}</p>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
