'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import {
  TrendingUp, CheckCircle2, DollarSign,
  User, Building2, Loader2, Search, AlertTriangle, ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Investment {
  id: string
  businessId: string
  businessName: string
  sellerId: string
  sellerName: string
  investorId: string
  investorName: string
  investorEmail: string
  amount: number
  equityOffered: number
  expectedROI: number
  lockPeriod: number
  note?: string
  status: 'APPROVED' | 'REJECTED'
  createdAt: any
  approvedAt?: any
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function fmtDate(v: any) {
  if (!v) return '—'
  const d = v?.toDate ? v.toDate() : new Date(v)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_STYLE: Record<string, string> = {
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function AdminInvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filter, setFilter]           = useState<'ALL' | 'APPROVED' | 'REJECTED'>('ALL')

  const [violations, setViolations]   = useState<any[]>([])
  const [activeTab, setActiveTab]     = useState<'investments' | 'violations'>('investments')

  useEffect(() => {
    const load = async () => {
      const { db } = await import('@/lib/firebase')
      const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore')
      const q = query(collection(db, 'investments'), orderBy('createdAt', 'desc'))
      return onSnapshot(q, snap => {
        setInvestments(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Investment))
        setLoading(false)
      })
    }
    let unsub: () => void
    load().then(u => { unsub = u }).catch(() => setLoading(false))
    return () => unsub?.()
  }, [])

  useEffect(() => {
    if (activeTab !== 'violations') return
    const load = async () => {
      const { db } = await import('@/lib/firebase')
      const { collection, query, orderBy, getDocs } = await import('firebase/firestore')
      const snap = await getDocs(query(collection(db, 'violations'), orderBy('createdAt', 'desc')))
      setViolations(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    load().catch(() => {})
  }, [activeTab])

  const handleUnblockUser = async (userId: string, userName: string) => {
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, setDoc } = await import('firebase/firestore')
      await setDoc(doc(db, 'user_flags', userId), { isBlocked: false, violationCount: 0 }, { merge: true })
      toast.success(`${userName} has been unblocked.`)
      setViolations(prev => prev.map(v => v.userId === userId ? { ...v, _unblocked: true } : v))
    } catch (e) {
      toast.error('Failed to unblock user')
    }
  }

  const filtered = investments.filter(inv => {
    const matchSearch = !search || [inv.businessName, inv.investorName, inv.sellerName].some(s =>
      s?.toLowerCase().includes(search.toLowerCase()))
    const matchFilter = filter === 'ALL' || inv.status === filter
    return matchSearch && matchFilter
  })

  const totalInvested = investments.filter(i => i.status === 'APPROVED').reduce((s, i) => s + i.amount, 0)
  const approvedCount = investments.filter(i => i.status === 'APPROVED').length
  const rejectedCount = investments.filter(i => i.status === 'REJECTED').length

  return (
    <DashboardLayout role="SUPER_ADMIN">
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display">Investment Monitor</h1>
          <p className="text-muted-foreground text-sm mt-1">All investments are auto-approved. Monitor platform activity here.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Total Invested', value: fmt(totalInvested), color: 'text-brand-400',   bg: 'bg-brand-500/10',   icon: DollarSign },
            { label: 'Approved',       value: approvedCount,      color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
            { label: 'Rejected',       value: rejectedCount,      color: 'text-red-400',     bg: 'bg-red-500/10',     icon: TrendingUp },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl p-4 flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', s.bg)}>
                <s.icon className={cn('w-5 h-5', s.color)} />
              </div>
              <div>
                <p className={cn('text-xl font-bold font-mono', s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-border">
          {(['investments', 'violations'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
                activeTab === tab
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}>
              {tab}
              {tab === 'violations' && violations.length > 0 && (
                <span className="ml-2 text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">{violations.length}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'investments' && (
          <>
            {/* Search + Filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search investor, business, seller…"
                  className="w-full bg-obsidian-800 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-500/50" />
              </div>
              <div className="flex gap-1 p-1 bg-obsidian-900/60 rounded-xl border border-border">
                {(['ALL', 'APPROVED', 'REJECTED'] as const).map(f => (
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
                <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <TrendingUp className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No investments found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((inv, i) => (
                  <motion.div key={inv.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="glass-card rounded-2xl p-4">
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-brand-400" />
                            <span className="font-semibold text-sm">{inv.businessName}</span>
                          </div>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', STATUS_STYLE[inv.status] ?? STATUS_STYLE.APPROVED)}>
                            {inv.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {inv.investorName}</span>
                          <span>{inv.investorEmail}</span>
                          <span>Seller: {inv.sellerName}</span>
                          <span>{fmtDate(inv.createdAt)}</span>
                        </div>
                        {inv.note && (
                          <p className="text-xs text-muted-foreground/70 mt-1.5 italic">"{inv.note}"</p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold font-mono text-emerald-400">{fmt(inv.amount)}</p>
                        <p className="text-xs text-muted-foreground">{inv.equityOffered}% equity · {inv.expectedROI}% ROI</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'violations' && (
          <div className="space-y-3">
            {violations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <ShieldAlert className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No violations recorded</p>
              </div>
            ) : violations.map((v, i) => (
              <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold text-sm">{v.violationLabel}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">{v.role}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">By <strong>{v.userName}</strong> · {fmtDate(v.createdAt)}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1 font-mono bg-obsidian-800 rounded-lg px-2 py-1 inline-block max-w-xs truncate">
                      "{v.message}"
                    </p>
                  </div>
                  {!v._unblocked ? (
                    <button onClick={() => handleUnblockUser(v.userId, v.userName)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs border border-emerald-500/20 transition-all flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Unblock
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400/60">Unblocked</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
