'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuthStore } from '@/stores/auth.store'
import {
  Building2, MessageSquare, Plus, ChevronRight,
  Clock, CheckCircle2, XCircle, TrendingUp, Users, DollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Business {
  id: string
  name: string
  category: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  askingAmount: number
  ttmRevenue: number
  viewCount: number
  interestedCount: number
}

interface ChatRoom {
  id: string
  investorName: string
  businessName: string
  lastMessage: string
  lastMessageAt: any
  unreadSeller: number
}

function fmt(n: number) {
  if (n >= 1_00_00_000) return `₨${(n / 1_00_00_000).toFixed(1)} Cr`
  if (n >= 1_00_000)    return `₨${(n / 1_00_000).toFixed(1)} L`
  if (n >= 1_000)       return `₨${(n / 1_000).toFixed(0)}K`
  return `₨${n.toLocaleString('en-PK')}`
}

const STATUS: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  PENDING:   { label: 'Under Review', icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  APPROVED:  { label: 'Live',         icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  PUBLISHED: { label: 'Live',         icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  REJECTED:  { label: 'Rejected',     icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
}
const DEFAULT_STATUS = STATUS.PUBLISHED

export default function SellerDashboard() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [chats, setChats]           = useState<ChatRoom[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, query, where, getDocs } = await import('firebase/firestore')

        const [bizSnap, chatSnap] = await Promise.all([
          getDocs(query(collection(db, 'businesses'), where('sellerId', '==', user.id))),
          getDocs(query(collection(db, 'chats'), where('sellerId', '==', user.id))),
        ])

        const bizList = bizSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Business)
        bizList.sort((a, b) => {
          const ta = (a as any).createdAt?.toDate?.()?.getTime?.() ?? 0
          const tb = (b as any).createdAt?.toDate?.()?.getTime?.() ?? 0
          return tb - ta
        })
        const chatList = chatSnap.docs.map(d => ({ id: d.id, ...d.data() }) as ChatRoom)
        chatList.sort((a, b) => {
          const ta = a.lastMessageAt?.toDate?.()?.getTime?.() ?? 0
          const tb = b.lastMessageAt?.toDate?.()?.getTime?.() ?? 0
          return tb - ta
        })
        setBusinesses(bizList)
        setChats(chatList)
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [user])

  const liveBiz     = businesses.filter(b => b.status === 'APPROVED')
  const pendingBiz  = businesses.filter(b => b.status === 'PENDING')
  const unreadChats = chats.filter(c => c.unreadSeller > 0)
  const totalViews  = businesses.reduce((s, b) => s + (b.viewCount || 0), 0)

  return (
    <DashboardLayout role="SELLER">
      <div className="p-6 lg:p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Welcome, {user?.firstName}</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your businesses and investor conversations</p>
          </div>
          <button onClick={() => router.push('/seller/businesses/create')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-obsidian-950 text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" /> New Business
          </button>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Live Businesses',  value: liveBiz.length,         color: 'text-emerald-400', icon: CheckCircle2 },
              { label: 'Under Review',     value: pendingBiz.length,       color: 'text-amber-400',   icon: Clock },
              { label: 'Unread Messages',  value: unreadChats.length,      color: 'text-brand-400',   icon: MessageSquare },
              { label: 'Total Views',      value: totalViews,              color: 'text-violet-400',  icon: Users },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <s.icon className={cn('w-4 h-4', s.color)} />
                </div>
                <p className={cn('text-3xl font-bold font-display font-mono', s.color)}>{s.value}</p>
              </motion.div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* My Businesses */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-semibold">My Businesses</h3>
              <button onClick={() => router.push('/seller/businesses')}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition-colors">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {businesses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Building2 className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No businesses yet</p>
                <button onClick={() => router.push('/seller/businesses/create')}
                  className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">
                  + Create your first business
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {businesses.slice(0, 4).map(b => {
                  const st = STATUS[b.status] ?? DEFAULT_STATUS
                  return (
                    <div key={b.id} onClick={() => router.push('/seller/businesses')}
                      className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
                      <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-brand-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.category}</p>
                      </div>
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0', st.color, st.bg)}>
                        {st.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Messages */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-semibold">Recent Messages</h3>
              <button onClick={() => router.push('/seller/inbox')}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition-colors">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <MessageSquare className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground">Investors will contact you when interested</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {chats.slice(0, 4).map(chat => (
                  <div key={chat.id} onClick={() => router.push(`/seller/inbox?chatId=${chat.id}`)}
                    className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 relative">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      {chat.unreadSeller > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-500 text-obsidian-950 text-[10px] font-bold flex items-center justify-center">
                          {chat.unreadSeller}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{chat.investorName}</p>
                      <p className="text-xs text-brand-400 truncate">{chat.businessName}</p>
                      {chat.lastMessage && (
                        <p className="text-xs text-muted-foreground/70 truncate">{chat.lastMessage}</p>
                      )}
                    </div>
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
