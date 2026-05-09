'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import {
  Search, Building2, TrendingUp, Users, DollarSign,
  Shield, ChevronRight, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Business {
  id: string
  sellerId: string
  sellerName: string
  name: string
  tagline: string
  description: string
  category: string
  industry: string
  country: string
  investmentType: string
  riskLevel: 'Low' | 'Medium' | 'High'
  askingAmount: number
  minInvestment: number
  equityOffered: number
  expectedROI: number
  lockPeriod: number
  ttmRevenue: number
  ttmProfit: number
  customers: number
  annualGrowthRate: number
  highlights: string[]
  viewCount: number
  interestedCount: number
  status: string
  createdAt: any
  website?: string
  founded?: string
  companySize?: string
  lastMonthRevenue?: number
  lastMonthProfit?: number
  candleData?: any[]
  graphTrend?: 'UP' | 'DOWN'
}

const RISK_COLORS = {
  Low:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Medium: 'text-amber-400  bg-amber-500/10  border-amber-500/20',
  High:   'text-red-400    bg-red-500/10    border-red-500/20',
}

function fmt(n: number) {
  if (n >= 1_00_00_000) return `₨${(n / 1_00_00_000).toFixed(1)} Cr`
  if (n >= 1_00_000)    return `₨${(n / 1_00_000).toFixed(1)} L`
  if (n >= 1_000)       return `₨${(n / 1_000).toFixed(0)}K`
  return `₨${n.toLocaleString('en-PK')}`
}

const CATEGORIES = ['All', 'Technology', 'Real Estate', 'Healthcare', 'Finance',
  'Food & Beverage', 'E-commerce', 'Education', 'Manufacturing', 'Energy', 'Logistics', 'Other']

export default function InvestorMarketplace() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('All')

  useEffect(() => {
    const load = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, query, where, getDocs } = await import('firebase/firestore')
        const q = query(
          collection(db, 'businesses'),
          where('status', '==', 'PUBLISHED'),
        )
        const snap = await getDocs(q)
        console.log('[Marketplace] total docs:', snap.size, snap.docs.map(d => ({ id: d.id, status: d.data().status, name: d.data().name })))
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Business)
        list.sort((a, b) => {
          const ta = a.createdAt?.toDate?.()?.getTime?.() ?? 0
          const tb = b.createdAt?.toDate?.()?.getTime?.() ?? 0
          return tb - ta
        })
        setBusinesses(list)
      } catch (e) { console.error('[Marketplace] error:', e) }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = businesses.filter(b => {
    const matchCat = category === 'All' || b.category === category
    const matchQ   = !search || b.name.toLowerCase().includes(search.toLowerCase()) ||
                     b.description?.toLowerCase().includes(search.toLowerCase()) ||
                     b.industry?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchQ
  })

  return (
    <DashboardLayout role="INVESTOR">
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-display">Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? 'Loading opportunities…' : `${businesses.length} verified businesses seeking investment`}
          </p>
        </div>

        {/* Search + category filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search businesses, industries, categories…"
              className="w-full bg-obsidian-800 border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  category === c
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                    : 'text-muted-foreground hover:text-foreground border border-transparent hover:bg-white/5',
                )}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-20 gap-4">
            <Building2 className="w-12 h-12 text-muted-foreground/30" />
            <div className="text-center">
              <p className="font-semibold">No businesses found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {businesses.length === 0
                  ? 'No approved businesses yet — check back soon.'
                  : 'Try adjusting your search or filters.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => router.push(`/investor/marketplace/${b.id}`)}
                className="glass-card rounded-2xl p-5 cursor-pointer hover:bg-white/[0.04] hover:border-brand-500/20 border border-transparent transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-brand-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{b.name}</h3>
                      <p className="text-xs text-muted-foreground">{b.category} · {b.country}</p>
                    </div>
                  </div>
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ml-2',
                    RISK_COLORS[b.riskLevel] || RISK_COLORS.Medium)}>
                    {b.riskLevel}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                  {b.tagline || b.description}
                </p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-obsidian-800/60 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">Asking</p>
                    <p className="text-sm font-bold font-mono text-brand-400">{fmt(b.askingAmount)}</p>
                  </div>
                  <div className="bg-obsidian-800/60 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">Expected ROI</p>
                    <p className="text-sm font-bold font-mono text-emerald-400">{b.expectedROI}%</p>
                  </div>
                  <div className="bg-obsidian-800/60 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">TTM Revenue</p>
                    <p className="text-sm font-bold font-mono">{fmt(b.ttmRevenue)}</p>
                  </div>
                  <div className="bg-obsidian-800/60 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">Growth</p>
                    <p className="text-sm font-bold font-mono text-emerald-400">+{b.annualGrowthRate}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {b.investmentType}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {b.customers?.toLocaleString()}</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-brand-400 font-medium group-hover:gap-2 transition-all">
                    View <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
