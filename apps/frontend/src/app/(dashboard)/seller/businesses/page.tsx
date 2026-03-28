'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuthStore } from '@/stores/auth.store'
import {
  Plus, Building2, Eye, Globe, EyeOff,
  TrendingUp, Users, DollarSign, ChevronRight, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Business {
  id: string
  name: string
  category: string
  status: 'PUBLISHED' | 'DRAFT'
  askingAmount: number
  ttmRevenue: number
  customers: number
  createdAt: string
  viewCount?: number
  interestedCount?: number
}

const STATUS = {
  PUBLISHED: { label: 'Live',  icon: Globe,   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  DRAFT:     { label: 'Draft', icon: EyeOff,  color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

export default function SellerBusinessesPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, query, where, getDocs } = await import('firebase/firestore')
        const q = query(
          collection(db, 'businesses'),
          where('sellerId', '==', user.id),
        )
        const snap = await getDocs(q)
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
  }, [user])

  const handleTogglePublish = async (e: React.MouseEvent, b: Business) => {
    e.stopPropagation()
    if (toggling) return
    setToggling(b.id)
    const newStatus = b.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc } = await import('firebase/firestore')
      await updateDoc(doc(db, 'businesses', b.id), { status: newStatus, updatedAt: new Date().toISOString() })
      setBusinesses(prev => prev.map(x => x.id === b.id ? { ...x, status: newStatus } : x))
      toast.success(newStatus === 'PUBLISHED' ? 'Business is now live on the marketplace' : 'Business moved to draft')
    } catch (e) {
      console.error(e)
      toast.error('Failed to update status')
    }
    setToggling(null)
  }

  return (
    <DashboardLayout role="SELLER">
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">My Businesses</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your business listings on the marketplace</p>
          </div>
          <button
            onClick={() => router.push('/seller/businesses/create')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-obsidian-950 text-sm font-semibold transition-all"
          >
            <Plus className="w-4 h-4" /> New Business
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Listed', value: businesses.length,                                      color: 'text-foreground' },
            { label: 'Live',         value: businesses.filter(b => b.status === 'PUBLISHED').length, color: 'text-emerald-400' },
            { label: 'Draft',        value: businesses.filter(b => b.status === 'DRAFT').length,     color: 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
              <p className={cn('text-2xl font-bold font-display', s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : businesses.length === 0 ? (
          <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-brand-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold">No businesses yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first business listing to attract investors</p>
            </div>
            <button
              onClick={() => router.push('/seller/businesses/create')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-obsidian-950 text-sm font-semibold transition-all mt-2"
            >
              <Plus className="w-4 h-4" /> Create Business
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {businesses.map((b, i) => {
              const st = STATUS[b.status] ?? STATUS.DRAFT
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => router.push(`/seller/businesses/${b.id}`)}
                  className="glass-card rounded-2xl p-5 hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-brand-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold">{b.name}</h3>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', st.color, st.bg)}>
                          <st.icon className="w-3 h-3 inline mr-1" />{st.label}
                        </span>
                        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-white/5">
                          {b.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-5 mt-3 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <DollarSign className="w-3.5 h-3.5 text-brand-400" />
                          <span>Asking <span className="text-foreground font-mono font-medium">{fmt(b.askingAmount)}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          <span>TTM Rev <span className="text-emerald-400 font-mono font-medium">{fmt(b.ttmRevenue)}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="w-3.5 h-3.5 text-violet-400" />
                          <span><span className="text-foreground font-medium">{b.customers?.toLocaleString()}</span> customers</span>
                        </div>
                        {b.status === 'PUBLISHED' && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{b.viewCount || 0} views</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Publish / Unpublish toggle */}
                      <button
                        onClick={e => handleTogglePublish(e, b)}
                        disabled={toggling === b.id}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-50',
                          b.status === 'PUBLISHED'
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
                        )}
                      >
                        {toggling === b.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : b.status === 'PUBLISHED'
                            ? <EyeOff className="w-3 h-3" />
                            : <Globe className="w-3 h-3" />
                        }
                        {b.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                      </button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
