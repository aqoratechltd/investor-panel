'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import {
  TrendingUp, TrendingDown, Building2, Loader2, Search, BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface GraphUpdate {
  id: string
  businessId: string
  businessName: string
  sellerId: string
  sellerName: string
  direction: 'UP' | 'DOWN'
  magnitude: number
  appliedAt: any
}

function fmtDate(v: any) {
  if (!v) return '—'
  const d = v?.toDate ? v.toDate() : new Date(v)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminGraphUpdatesPage() {
  const [updates, setUpdates]   = useState<GraphUpdate[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState<'ALL' | 'UP' | 'DOWN'>('ALL')

  useEffect(() => {
    const load = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, query, orderBy, getDocs } = await import('firebase/firestore')
        const snap = await getDocs(query(collection(db, 'graph_updates'), orderBy('appliedAt', 'desc')))
        setUpdates(snap.docs.map(d => ({ id: d.id, ...d.data() }) as GraphUpdate))
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = updates.filter(u => {
    const matchDir = filter === 'ALL' || u.direction === filter
    const matchSearch = !search ||
      u.businessName?.toLowerCase().includes(search.toLowerCase()) ||
      u.sellerName?.toLowerCase().includes(search.toLowerCase())
    return matchDir && matchSearch
  })

  const upCount   = updates.filter(u => u.direction === 'UP').length
  const downCount = updates.filter(u => u.direction === 'DOWN').length

  return (
    <DashboardLayout role="SUPER_ADMIN">
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display">Chart Update History</h1>
          <p className="text-sm text-muted-foreground mt-1">Sellers apply chart direction changes directly. Monitor all activity here.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Updates', value: updates.length,  color: 'text-foreground' },
            { label: 'Push Up',       value: upCount,         color: 'text-emerald-400' },
            { label: 'Push Down',     value: downCount,       color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="glass-card rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={cn('text-2xl font-bold font-display', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search business or seller…"
              className="w-full bg-obsidian-900 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20" />
          </div>
          <div className="flex gap-1 p-1 bg-obsidian-900/60 rounded-xl border border-border">
            {(['ALL', 'UP', 'DOWN'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  filter === f ? 'bg-obsidian-800 text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {f === 'ALL' ? 'All' : f === 'UP' ? '↑ Up' : '↓ Down'}
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
            <BarChart3 className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No chart updates yet</p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">Business</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4 hidden md:table-cell">Seller</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Direction</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Magnitude</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4 hidden sm:table-cell">Applied At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((u, i) => (
                    <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-brand-400 flex-shrink-0" />
                          <p className="text-sm font-medium">{u.businessName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <p className="text-sm text-muted-foreground">{u.sellerName}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border',
                          u.direction === 'UP'
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-red-400 bg-red-500/10 border-red-500/20',
                        )}>
                          {u.direction === 'UP'
                            ? <TrendingUp className="w-3 h-3" />
                            : <TrendingDown className="w-3 h-3" />
                          }
                          {u.direction}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-mono font-semibold text-brand-400">{u.magnitude}%</p>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <p className="text-xs text-muted-foreground">{fmtDate(u.appliedAt)}</p>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
