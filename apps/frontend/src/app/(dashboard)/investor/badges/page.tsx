'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Award, Lock, Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuthStore } from '@/stores/auth.store'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY'
  color: string
  earned: boolean
  earnedAt?: string
  businessName?: string
}

const RARITY_COLORS: Record<string, string> = {
  COMMON:    'text-slate-400 bg-slate-500/10 border-slate-500/20',
  UNCOMMON:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  RARE:      'text-blue-400 bg-blue-500/10 border-blue-500/20',
  LEGENDARY: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
}

export default function InvestorBadgesPage() {
  const { user }  = useAuthStore()
  const [badges, setBadges]   = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore')
        const q = query(
          collection(db, 'badges'),
          where('userId', '==', user.id),
          orderBy('earnedAt', 'desc'),
        )
        const snap = await getDocs(q)
        setBadges(snap.docs.map(d => ({ id: d.id, earned: true, ...d.data() }) as Badge))
      } catch (e) {
        console.error(e)
        toast.error('Failed to load badges')
      }
      setLoading(false)
    }
    load()
  }, [user?.id])

  const earned = badges.filter(b => b.earned)
  const locked: Badge[] = [] // locked badges would come from a system config; for now show empty

  if (loading) return (
    <DashboardLayout role="INVESTOR" title="Badges & Achievements" subtitle="Your investment milestones and rewards">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout role="INVESTOR" title="Badges & Achievements" subtitle="Your investment milestones and rewards">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Earned', value: earned.length, color: 'text-emerald-400' },
          { label: 'Locked', value: locked.length, color: 'text-muted-foreground' },
          { label: 'Total',  value: badges.length, color: 'text-brand-400' },
        ].map(s => (
          <div key={s.label} className="gradient-border p-6 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
            <p className={`text-3xl font-display font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label} Badges</p>
          </div>
        ))}
      </div>

      {/* Earned */}
      <div className="mb-10">
        <h3 className="font-display font-bold mb-5 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          Earned ({earned.length})
        </h3>
        {earned.length === 0 ? (
          <div className="gradient-border p-10 flex flex-col items-center gap-4 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)' }}>
            <Award className="w-10 h-10 text-muted-foreground/30" />
            <div>
              <p className="font-semibold text-muted-foreground">No badges earned yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Get your first approved investment to earn your first badge</p>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {earned.map((badge, i) => (
              <motion.div key={badge.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
                className="gradient-border p-5 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)' }}>
                <div className="flex items-start gap-4 relative">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${badge.color || 'from-brand-400/20 to-brand-600/20'} flex items-center justify-center flex-shrink-0 shadow-lg text-2xl`}>
                    {badge.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm">{badge.name}</h4>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full border ${RARITY_COLORS[badge.rarity] || RARITY_COLORS.COMMON}`}>
                        {badge.rarity?.toLowerCase()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
                    {badge.businessName && (
                      <p className="text-xs text-brand-400/80 mb-1">via {badge.businessName}</p>
                    )}
                    {badge.earnedAt && (
                      <p className="text-xs text-emerald-400 flex items-center gap-1">
                        <Award className="w-3 h-3" />Earned {formatDate(badge.earnedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Locked (empty for now) */}
      {locked.length > 0 && (
        <div>
          <h3 className="font-display font-bold mb-5 flex items-center gap-2">
            <Lock className="w-5 h-5 text-muted-foreground" />
            Locked ({locked.length})
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locked.map((badge, i) => (
              <motion.div key={badge.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="gradient-border p-5 opacity-50"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)' }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-obsidian-800 flex items-center justify-center flex-shrink-0 relative text-2xl opacity-40">
                    {badge.icon}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-obsidian-900 border border-border rounded-full flex items-center justify-center">
                      <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm text-muted-foreground">{badge.name}</h4>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full border ${RARITY_COLORS[badge.rarity] || RARITY_COLORS.COMMON}`}>
                        {badge.rarity?.toLowerCase()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
