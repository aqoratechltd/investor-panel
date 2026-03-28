'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuthStore } from '@/stores/auth.store'
import {
  TrendingUp, DollarSign, Clock, Award, Star, CheckCircle2,
  XCircle, Loader2, Building2, Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Investment {
  id: string
  businessId: string
  businessName: string
  sellerName: string
  amount: number
  equityOffered: number
  expectedROI: number
  lockPeriod: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  note?: string
  rejectionReason?: string
  createdAt: any
}

interface Badge {
  id: string
  type: string
  label: string
  businessName: string
  amount: number
  earnedAt: any
}

interface UserFlags {
  points?: number
  violationCount?: number
  isBlocked?: boolean
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
  PENDING:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const STATUS_ICON: Record<string, any> = {
  PENDING:  Clock,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
}

export default function InvestorInvestmentsPage() {
  const { user } = useAuthStore()
  const [investments, setInvestments] = useState<Investment[]>([])
  const [badges, setBadges]           = useState<Badge[]>([])
  const [userFlags, setUserFlags]     = useState<UserFlags>({})
  const [loading, setLoading]         = useState(true)
  const [activeTab, setActiveTab]     = useState<'investments' | 'badges'>('investments')

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { db } = await import('@/lib/firebase')
      const { collection, query, where, getDocs, doc, getDoc } = await import('firebase/firestore')

      const [invSnap, badgeSnap, flagSnap] = await Promise.all([
        getDocs(query(collection(db, 'investments'), where('investorId', '==', user.id))),
        getDocs(query(collection(db, 'badges'), where('userId', '==', user.id))),
        getDoc(doc(db, 'user_flags', user.id)),
      ])

      const invList = invSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Investment)
      invList.sort((a, b) => {
        const ta = a.createdAt?.toDate?.()?.getTime?.() ?? 0
        const tb = b.createdAt?.toDate?.()?.getTime?.() ?? 0
        return tb - ta
      })

      const badgeList = badgeSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Badge)
      badgeList.sort((a, b) => {
        const ta = a.earnedAt?.toDate?.()?.getTime?.() ?? 0
        const tb = b.earnedAt?.toDate?.()?.getTime?.() ?? 0
        return tb - ta
      })

      setInvestments(invList)
      setBadges(badgeList)
      if (flagSnap.exists()) setUserFlags(flagSnap.data() as UserFlags)
      setLoading(false)
    }
    load().catch(() => setLoading(false))
  }, [user])

  const approved = investments.filter(i => i.status === 'APPROVED')
  const totalInvested = approved.reduce((s, i) => s + i.amount, 0)
  const projectedReturn = approved.reduce((s, i) => s + i.amount * (1 + i.expectedROI / 100), 0)
  const points = userFlags.points ?? 0

  return (
    <DashboardLayout role="INVESTOR">
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display">My Investments</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your investment portfolio and achievements</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Wallet,     label: 'Total Invested',   value: fmt(totalInvested),     color: 'text-brand-400' },
            { icon: TrendingUp, label: 'Projected Return', value: fmt(projectedReturn),   color: 'text-emerald-400' },
            { icon: Star,       label: 'Platform Points',  value: `${points} pts`,        color: 'text-amber-400' },
            { icon: Award,      label: 'Badges Earned',    value: badges.length,          color: 'text-violet-400' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                  <s.icon className={cn('w-4 h-4', s.color)} />
                </div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className={cn('text-2xl font-bold font-mono', s.color)}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-border">
          {(['investments', 'badges'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
                activeTab === tab
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}>
              {tab}
              {tab === 'investments' && investments.length > 0 && (
                <span className="ml-2 text-xs bg-obsidian-700 rounded-full px-1.5 py-0.5">{investments.length}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
          </div>
        ) : activeTab === 'investments' ? (
          investments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-brand-400" />
              </div>
              <div>
                <p className="font-semibold">No investments yet</p>
                <p className="text-sm text-muted-foreground mt-1">Browse the marketplace and invest in any live business instantly</p>
              </div>
              <a href="/investor/marketplace"
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-obsidian-950 text-sm font-semibold transition-all">
                Browse Marketplace
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {investments.map((inv, i) => {
                const StatusIcon = STATUS_ICON[inv.status]
                const projReturn = inv.amount * (1 + inv.expectedROI / 100)
                return (
                  <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-brand-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{inv.businessName}</h3>
                            <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1', STATUS_STYLE[inv.status])}>
                              <StatusIcon className="w-3 h-3" />
                              {inv.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">by {inv.sellerName} · {fmtDate(inv.createdAt)}</p>
                          {inv.rejectionReason && (
                            <p className="text-xs text-red-400 mt-1">Rejected: {inv.rejectionReason}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <p className="text-lg font-bold font-mono text-emerald-400">{fmt(inv.amount)}</p>
                          <p className="text-xs text-muted-foreground">Invested</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold font-mono text-brand-400">{inv.expectedROI}%</p>
                          <p className="text-xs text-muted-foreground">ROI</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold font-mono text-violet-400">{inv.equityOffered}%</p>
                          <p className="text-xs text-muted-foreground">Equity</p>
                        </div>
                      </div>
                    </div>

                    {inv.status === 'APPROVED' && (
                      <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-3">
                        <div className="bg-obsidian-800/60 rounded-xl p-3 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Projected Return</span>
                          <span className="text-sm font-bold font-mono text-emerald-400">{fmt(projReturn)}</span>
                        </div>
                        <div className="bg-obsidian-800/60 rounded-xl p-3 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Lock Period</span>
                          <span className="text-sm font-bold">{inv.lockPeriod} months</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )
        ) : (
          /* Badges tab */
          badges.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Award className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <p className="font-semibold">No badges yet</p>
                <p className="text-sm text-muted-foreground mt-1">Get your first investment approved to earn the <span className="text-amber-400">Active Investor</span> badge!</p>
              </div>
            </div>
          ) : (
            <>
              {/* Points banner */}
              <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="font-bold text-amber-400 text-xl font-mono">{points} Points</p>
                  <p className="text-xs text-muted-foreground">+5 points per approved investment</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.map((badge, i) => (
                  <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                    className="glass-card rounded-2xl p-5 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3 ring-2 ring-amber-500/20">
                      <Award className="w-8 h-8 text-amber-400" />
                    </div>
                    <p className="font-bold text-amber-400">{badge.label}</p>
                    <p className="text-sm text-muted-foreground mt-1">{badge.businessName}</p>
                    <p className="text-xs text-emerald-400 font-mono mt-1">{fmt(badge.amount)}</p>
                    <p className="text-xs text-muted-foreground mt-2">{fmtDate(badge.earnedAt)}</p>
                  </motion.div>
                ))}
              </div>
            </>
          )
        )}
      </div>
    </DashboardLayout>
  )
}
