'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Coins, Gift, Star, TrendingUp, ShoppingBag, ArrowUpRight, Zap, Users, Eye, Award, Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MetricCard } from '@/components/ui/metric-card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import toast from 'react-hot-toast'

interface CoinHistoryEntry {
  id: string
  type: 'EARNED' | 'SPENT'
  amount: number
  description: string
  date: string
  source: string
}

const HOW_TO_EARN = [
  { icon: Users,    label: 'Referrals',             desc: 'Earn 500 coins per successful referral',         coins: 500,     color: 'text-brand-400 bg-brand-500/10' },
  { icon: TrendingUp, label: 'Investment Milestones', desc: 'Reach investment targets to unlock rewards',     coins: 1000,    color: 'text-violet-400 bg-violet-500/10' },
  { icon: Eye,      label: 'Ad Interactions',        desc: 'View or click featured advertisements',          coins: 50,      color: 'text-amber-400 bg-amber-500/10' },
  { icon: Star,     label: 'Monthly Loyalty',        desc: 'Stay active for 30 days each month',             coins: 250,     color: 'text-emerald-400 bg-emerald-500/10' },
  { icon: Zap,      label: 'Special Promotions',     desc: 'Limited-time bonus coin events',                 coins: 'Varies', color: 'text-pink-400 bg-pink-500/10' },
]

const REWARDS = [
  { id: '1', name: 'Analytics Dashboard Pro',  desc: 'Unlock advanced portfolio analytics for 30 days',     cost: 200,  icon: TrendingUp,  color: 'text-brand-400 bg-brand-500/10',   available: true },
  { id: '2', name: 'Priority Withdrawal',      desc: 'Jump to the front of the withdrawal queue',           cost: 500,  icon: ArrowUpRight, color: 'text-emerald-400 bg-emerald-500/10', available: true },
  { id: '3', name: 'Referral Voucher',         desc: 'Give your referral a $50 investment bonus',           cost: 500,  icon: Gift,        color: 'text-violet-400 bg-violet-500/10', available: true },
  { id: '4', name: 'Exclusive Badge',          desc: 'Earn the "Gold Investor" badge on your profile',      cost: 1000, icon: Award,       color: 'text-amber-400 bg-amber-500/10',   available: true },
  { id: '5', name: 'Seller Promo Boost',       desc: 'Get featured in seller promotional campaigns',        cost: 2000, icon: Star,        color: 'text-pink-400 bg-pink-500/10',     available: false },
]

export default function InvestorCoinsPage() {
  const { user } = useAuthStore()
  const [coinBalance, setCoinBalance]   = useState(0)
  const [coinHistory, setCoinHistory]   = useState<CoinHistoryEntry[]>([])
  const [loading, setLoading]           = useState(true)
  const [redeeming, setRedeeming]       = useState<string | null>(null)
  const [tab, setTab]                   = useState<'history' | 'earn' | 'spend'>('history')

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, query, where, orderBy, getDocs, getDoc, doc } = await import('firebase/firestore')

        const [historySnap, flagSnap] = await Promise.all([
          getDocs(query(
            collection(db, 'coin_history'),
            where('userId', '==', user.id),
            orderBy('createdAt', 'desc'),
          )),
          getDoc(doc(db, 'user_flags', user.id)),
        ])

        const history: CoinHistoryEntry[] = historySnap.docs.map(d => {
          const data = d.data()
          return {
            id: d.id,
            type: data.type || 'EARNED',
            amount: data.amount || 0,
            description: data.description || '',
            date: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? new Date().toISOString(),
            source: data.source || 'INVESTMENT',
          }
        })

        setCoinHistory(history)
        const flagData = flagSnap.exists() ? flagSnap.data() : {}
        setCoinBalance(flagData?.coinBalance ?? 0)
      } catch (e) {
        console.error('[Coins] load error:', e)
      }
      setLoading(false)
    }
    load()
  }, [user?.id])

  const handleRedeem = async (reward: typeof REWARDS[0]) => {
    if (!user?.id) return
    if (coinBalance < reward.cost) { toast.error('Insufficient coins'); return }
    setRedeeming(reward.id)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, addDoc, doc, setDoc, increment, serverTimestamp } = await import('firebase/firestore')

      await addDoc(collection(db, 'coin_history'), {
        userId: user.id,
        type: 'SPENT',
        amount: -reward.cost,
        description: `Redeemed: ${reward.name}`,
        source: 'REDEMPTION',
        createdAt: serverTimestamp(),
      })

      await setDoc(doc(db, 'user_flags', user.id), {
        coinBalance: increment(-reward.cost),
        userId: user.id,
      }, { merge: true })

      const entry: CoinHistoryEntry = {
        id: `ch_${Date.now()}`,
        type: 'SPENT',
        amount: -reward.cost,
        description: `Redeemed: ${reward.name}`,
        date: new Date().toISOString(),
        source: 'REDEMPTION',
      }
      setCoinHistory(prev => [entry, ...prev])
      setCoinBalance(prev => prev - reward.cost)
      toast.success(`${reward.name} redeemed!`)
    } catch (e: any) {
      toast.error(e?.message || 'Redemption failed')
    }
    setRedeeming(null)
  }

  const totalEarned = coinHistory.filter(h => h.type === 'EARNED').reduce((s, h) => s + h.amount, 0)
  const totalSpent  = Math.abs(coinHistory.filter(h => h.type === 'SPENT').reduce((s, h) => s + h.amount, 0))

  return (
    <DashboardLayout role="INVESTOR" title="My Coins" subtitle="Earn, track, and redeem your investment coins">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="gradient-border p-8 mb-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(6,182,212,0.04) 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-500/5 rounded-full translate-y-24 -translate-x-24" />
        <div className="relative">
          <p className="text-sm text-muted-foreground mb-2">Your Coin Balance</p>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
              <Coins className="w-7 h-7 text-amber-400" />
            </div>
            {loading
              ? <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              : <span className="text-5xl font-display font-bold font-mono text-amber-400">{coinBalance.toLocaleString()}</span>
            }
            <span className="text-xl text-muted-foreground">◈</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Equivalent to approximately{' '}
            <span className="text-foreground font-medium">${(coinBalance * 0.01).toFixed(0)}</span> in platform credits
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Total Earned"  value={totalEarned}       format="number" icon={Coins}       changeLabel="this month" iconColor="text-amber-400"  iconBg="bg-amber-500/10"  index={0} />
        <MetricCard title="Total Spent"   value={totalSpent}        format="number" icon={ShoppingBag} iconColor="text-violet-400" iconBg="bg-violet-500/10" index={1} />
        <MetricCard title="Balance"       value={coinBalance}       format="number" icon={Star}        iconColor="text-emerald-400" iconBg="bg-emerald-500/10" index={2} />
        <MetricCard title="Transactions"  value={coinHistory.length} format="number" icon={Users}      iconColor="text-brand-400"  iconBg="bg-brand-500/10"  index={3} />
      </div>

      <div className="flex gap-1 p-1 bg-obsidian-900/60 rounded-xl w-fit mb-8 border border-border">
        {(['history', 'earn', 'spend'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-obsidian-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {t === 'history' ? 'History' : t === 'earn' ? 'How to Earn' : 'Redeem'}
          </button>
        ))}
      </div>

      {tab === 'history' && (
        <div className="gradient-border overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
          {loading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="w-7 h-7 text-amber-400 animate-spin" /></div>
          ) : coinHistory.length === 0 ? (
            <div className="py-16 text-center">
              <Coins className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No coin history yet</p>
              <p className="text-xs text-muted-foreground mt-1">Make an investment to start earning coins</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {coinHistory.map((entry, i) => (
                <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${entry.type === 'EARNED' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    <Coins className={`w-4 h-4 ${entry.type === 'EARNED' ? 'text-emerald-400' : 'text-red-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{entry.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(entry.date)}</p>
                  </div>
                  <span className={`font-mono font-bold text-sm ${entry.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {entry.amount > 0 ? '+' : ''}{entry.amount} ◈
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'earn' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {HOW_TO_EARN.map((way, i) => (
            <motion.div key={way.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="gradient-border p-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${way.color}`}>
                <way.icon className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-sm mb-1">{way.label}</h4>
              <p className="text-xs text-muted-foreground mb-3">{way.desc}</p>
              <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-amber-400">
                <Coins className="w-4 h-4" />{typeof way.coins === 'number' ? `+${way.coins}` : way.coins} coins
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'spend' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REWARDS.map((reward, i) => (
            <motion.div key={reward.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`gradient-border p-5 ${!reward.available ? 'opacity-50' : ''}`}
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${reward.color}`}>
                <reward.icon className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-sm mb-1">{reward.name}</h4>
              <p className="text-xs text-muted-foreground mb-4">{reward.desc}</p>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-mono font-bold text-amber-400">
                  <Coins className="w-4 h-4" /> {reward.cost} ◈
                </span>
                <Button size="sm" variant={coinBalance >= reward.cost && reward.available ? 'brand' : 'glass'}
                  disabled={coinBalance < reward.cost || !reward.available || redeeming === reward.id}
                  className="h-7 text-xs"
                  onClick={() => handleRedeem(reward)}>
                  {redeeming === reward.id
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : !reward.available
                      ? 'Coming Soon'
                      : coinBalance < reward.cost
                        ? 'Insufficient'
                        : 'Redeem'}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
