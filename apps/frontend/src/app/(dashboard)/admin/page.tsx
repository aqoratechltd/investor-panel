'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Users, DollarSign, Building2, Clock, CheckCircle2,
  XCircle, ChevronRight, AlertCircle, UserCheck,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { cn } from '@/lib/utils'

interface Stats {
  totalSellers: number
  pendingSellerApps: number
  totalBusinesses: number
  pendingBusinesses: number
  approvedBusinesses: number
  totalInvestors: number
}

interface PendingBusiness {
  id: string
  name: string
  sellerName: string
  category: string
  askingAmount: number
  createdAt: any
}

interface PendingSellerApp {
  id: string
  fullName: string
  companyName: string
  email: string
  submittedAt: any
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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalSellers: 0, pendingSellerApps: 0,
    totalBusinesses: 0, pendingBusinesses: 0,
    approvedBusinesses: 0, totalInvestors: 0,
  })
  const [pendingBusinesses, setPendingBusinesses] = useState<PendingBusiness[]>([])
  const [pendingSellerApps, setPendingSellerApps] = useState<PendingSellerApp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, getDocs, query, where } = await import('firebase/firestore')

        const [bizSnap, appSnap, investorSnap] = await Promise.all([
          getDocs(collection(db, 'businesses')).catch(() => null),
          getDocs(collection(db, 'seller_applications')).catch(() => null),
          getDocs(query(collection(db, 'users'), where('role', '==', 'INVESTOR'))).catch(() => null),
        ])

        const allBiz: any[] = bizSnap ? bizSnap.docs.map(d => ({ id: d.id, ...d.data() })) : []
        const allApps: any[] = appSnap ? appSnap.docs.map(d => ({ id: d.id, ...d.data() })) : []

        setStats({
          totalSellers: allApps.filter((a: any) => a.status === 'APPROVED').length,
          pendingSellerApps: allApps.filter((a: any) => a.status === 'PENDING').length,
          totalBusinesses: allBiz.length,
          pendingBusinesses: allBiz.filter((b: any) => b.status === 'PENDING').length,
          approvedBusinesses: allBiz.filter((b: any) => b.status === 'PUBLISHED' || b.status === 'APPROVED').length,
          totalInvestors: investorSnap ? investorSnap.size : 0,
        })

        setPendingBusinesses(
          allBiz.filter((b: any) => b.status === 'PENDING').slice(0, 5).map((b: any) => ({
            id: b.id,
            name: b.name || b.companyName || '—',
            sellerName: b.sellerName || '—',
            category: b.category || b.industry || '—',
            askingAmount: b.askingAmount || 0,
            createdAt: b.createdAt,
          }))
        )
        setPendingSellerApps(
          allApps.filter((a: any) => a.status === 'PENDING').slice(0, 5).map((a: any) => ({
            id: a.id,
            fullName: a.fullName || '—',
            companyName: a.companyName || '—',
            email: a.email || '—',
            submittedAt: a.submittedAt,
          }))
        )
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [])

  const STAT_CARDS = [
    { label: 'Approved Sellers',    value: stats.totalSellers,       color: 'text-brand-400',    icon: Building2,    href: '/admin/seller-applications' },
    { label: 'Pending Applications',value: stats.pendingSellerApps,  color: 'text-amber-400',    icon: Clock,        href: '/admin/seller-applications' },
    { label: 'Live Businesses',      value: stats.approvedBusinesses, color: 'text-emerald-400',  icon: CheckCircle2, href: '/admin/businesses' },
    { label: 'Pending Businesses',   value: stats.pendingBusinesses,  color: 'text-amber-400',    icon: AlertCircle,  href: '/admin/businesses' },
    { label: 'Total Investors',      value: stats.totalInvestors,     color: 'text-violet-400',   icon: Users,        href: null },
    { label: 'Total Businesses',     value: stats.totalBusinesses,    color: 'text-foreground',   icon: Building2,    href: '/admin/businesses' },
  ]

  return (
    <DashboardLayout role="SUPER_ADMIN">
      <div className="p-6 lg:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold font-display">Platform Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time stats across all sellers and investors</p>
        </div>

        {/* Alert banners */}
        {(stats.pendingSellerApps > 0 || stats.pendingBusinesses > 0) && (
          <div className="space-y-3">
            {stats.pendingSellerApps > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-300 flex-1">
                  <span className="font-semibold">{stats.pendingSellerApps} seller application{stats.pendingSellerApps > 1 ? 's' : ''}</span> awaiting review
                </p>
                <button onClick={() => router.push('/admin/seller-applications')}
                  className="flex items-center gap-1 text-xs text-amber-400 font-medium hover:text-amber-300 transition-colors">
                  Review <ChevronRight className="w-3 h-3" />
                </button>
              </motion.div>
            )}
            {stats.pendingBusinesses > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-4 rounded-xl border border-brand-500/30 bg-brand-500/5">
                <Building2 className="w-5 h-5 text-brand-400 flex-shrink-0" />
                <p className="text-sm text-brand-300 flex-1">
                  <span className="font-semibold">{stats.pendingBusinesses} business listing{stats.pendingBusinesses > 1 ? 's' : ''}</span> waiting for approval
                </p>
                <button onClick={() => router.push('/admin/businesses')}
                  className="flex items-center gap-1 text-xs text-brand-400 font-medium hover:text-brand-300 transition-colors">
                  Review <ChevronRight className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {STAT_CARDS.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => s.href && router.push(s.href)}
                className={cn('glass-card rounded-2xl p-5', s.href && 'cursor-pointer hover:bg-white/[0.04] transition-colors')}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <s.icon className={cn('w-4 h-4', s.color)} />
                </div>
                <p className={cn('text-3xl font-bold font-display font-mono', s.color)}>{s.value}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pending reviews */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Businesses */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="font-semibold">Pending Business Reviews</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{stats.pendingBusinesses} awaiting decision</p>
              </div>
              <button onClick={() => router.push('/admin/businesses')}
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {pendingBusinesses.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                No pending businesses
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pendingBusinesses.map(b => (
                  <div key={b.id} onClick={() => router.push('/admin/businesses')}
                    className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-brand-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.sellerName} · {b.category}</p>
                    </div>
                    <p className="text-xs font-mono text-brand-400 flex-shrink-0">{fmt(b.askingAmount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Seller Applications */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="font-semibold">Pending Seller Applications</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{stats.pendingSellerApps} awaiting review</p>
              </div>
              <button onClick={() => router.push('/admin/seller-applications')}
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {pendingSellerApps.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                No pending applications
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pendingSellerApps.map(app => (
                  <div key={app.id} onClick={() => router.push('/admin/seller-applications')}
                    className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                      <UserCheck className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{app.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{app.companyName} · {app.email}</p>
                    </div>
                    <p className="text-xs text-muted-foreground flex-shrink-0">{fmtDate(app.submittedAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
