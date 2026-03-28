'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuthStore } from '@/stores/auth.store'
import {
  Crown, Send, CheckCircle2, Clock, XCircle,
  MessageSquare, Loader2, DollarSign, TrendingUp, Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface PlatformRequest {
  id: string
  investorId: string
  investorName: string
  investorEmail: string
  message: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  adminNote?: string
  chatId?: string
  deal?: {
    amount: number
    expectedROI: number
    lockPeriod: number
    status: 'PENDING_CONFIRM' | 'CONFIRMED'
  }
  createdAt: any
}

interface Message {
  id: string
  senderId: string
  senderName: string
  text: string
  createdAt: any
}

function fmtTime(v: any) {
  if (!v) return ''
  const d = v?.toDate ? v.toDate() : new Date(v)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 86400) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

export default function InvestorPlatformPage() {
  const { user } = useAuthStore()
  const [request, setRequest]       = useState<PlatformRequest | null>(null)
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [msgText, setMsgText]       = useState('')
  const [messages, setMessages]     = useState<Message[]>([])
  const [sending, setSending]       = useState(false)
  const [pitch, setPitch]           = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load existing request
  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, query, where, getDocs } = await import('firebase/firestore')
        const snap = await getDocs(query(
          collection(db, 'platform_requests'),
          where('investorId', '==', user.id),
        ))
        if (!snap.empty) {
          setRequest({ id: snap.docs[0].id, ...snap.docs[0].data() } as PlatformRequest)
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [user?.id])

  // Subscribe to chat messages if request is accepted and has a chatId
  useEffect(() => {
    if (!request?.chatId) return
    let unsub: () => void
    const sub = async () => {
      const { db } = await import('@/lib/firebase')
      const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore')
      const q = query(
        collection(db, 'chats', request.chatId!, 'messages'),
        orderBy('createdAt', 'asc'),
      )
      unsub = onSnapshot(q, snap => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Message))
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
    }
    sub()
    return () => unsub?.()
  }, [request?.chatId])

  // Mark admin messages as read
  useEffect(() => {
    if (!request?.chatId || !user?.id) return
    const mark = async () => {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc } = await import('firebase/firestore')
      await updateDoc(doc(db, 'chats', request.chatId!), { unreadInvestor: 0 }).catch(() => {})
    }
    mark()
  }, [messages.length, request?.chatId, user?.id])

  const handleSubmit = async () => {
    if (!user || !pitch.trim()) { toast.error('Please describe what you want to work on'); return }
    setSubmitting(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
      const ref = await addDoc(collection(db, 'platform_requests'), {
        investorId:    user.id,
        investorName:  `${user.firstName} ${user.lastName}`,
        investorEmail: user.email,
        message:       pitch.trim(),
        status:        'PENDING',
        createdAt:     serverTimestamp(),
      })
      // Notify admin via notifications
      const adminQ = await import('firebase/firestore').then(m =>
        m.getDocs(m.query(m.collection(db, 'users'), m.where('role', '==', 'SUPER_ADMIN')))
      )
      for (const adminDoc of adminQ.docs) {
        await addDoc(collection(db, 'notifications'), {
          userId:    adminDoc.id,
          title:     'New Platform Partnership Request',
          message:   `${user.firstName} ${user.lastName} wants to work directly with the platform.`,
          type:      'INFO',
          read:      false,
          createdAt: serverTimestamp(),
        })
      }
      setRequest({ id: ref.id, investorId: user.id, investorName: `${user.firstName} ${user.lastName}`, investorEmail: user.email, message: pitch.trim(), status: 'PENDING', createdAt: new Date() })
      toast.success('Request sent! The platform owner will review it.')
    } catch (e) {
      console.error(e)
      toast.error('Failed to send request')
    }
    setSubmitting(false)
  }

  const handleSendMessage = async () => {
    if (!user || !request?.chatId || !msgText.trim()) return
    setSending(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, addDoc, doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
      const text = msgText.trim()
      setMsgText('')
      await addDoc(collection(db, 'chats', request.chatId, 'messages'), {
        senderId:   user.id,
        senderName: `${user.firstName} ${user.lastName}`,
        text,
        createdAt:  serverTimestamp(),
      })
      await updateDoc(doc(db, 'chats', request.chatId), {
        lastMessage:   text,
        lastMessageAt: serverTimestamp(),
        unreadAdmin:   1,
        unreadInvestor: 0,
      })
    } catch (e) {
      toast.error('Failed to send message')
    }
    setSending(false)
  }

  const handleConfirmDeal = async () => {
    if (!user || !request?.deal || !request.id) return
    const { amount } = request.deal
    setConfirming(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, getDoc, updateDoc, addDoc, increment, setDoc, collection, serverTimestamp } = await import('firebase/firestore')

      // Check wallet balance
      const flagsSnap = await getDoc(doc(db, 'user_flags', user.id))
      const balance = flagsSnap.exists() ? (flagsSnap.data().coinBalance ?? 0) : 0
      if (balance < amount) {
        toast.error(`Insufficient balance. You have $${balance.toLocaleString()}.`)
        setConfirming(false)
        return
      }

      // Deduct wallet
      await updateDoc(doc(db, 'user_flags', user.id), { coinBalance: increment(-amount) })

      // Update request — deal confirmed
      await updateDoc(doc(db, 'platform_requests', request.id), {
        'deal.status': 'CONFIRMED',
        confirmedAt:   serverTimestamp(),
      })

      // Award Partner badge
      await addDoc(collection(db, 'badges'), {
        userId:       user.id,
        userName:     `${user.firstName} ${user.lastName}`,
        type:         'PLATFORM_PARTNER',
        label:        'Platform Partner',
        businessName: 'Platform Direct',
        amount,
        earnedAt:     serverTimestamp(),
      })

      // Award points
      await setDoc(doc(db, 'user_flags', user.id), { points: increment(20) }, { merge: true })

      // Log ledger
      await addDoc(collection(db, 'coin_ledger'), {
        userId:      user.id,
        type:        'PLATFORM_DEAL',
        amount:      -amount,
        description: 'Platform direct deal confirmed',
        createdAt:   serverTimestamp(),
      })

      // Notify admin
      const adminQ = await import('firebase/firestore').then(m =>
        m.getDocs(m.query(m.collection(db, 'users'), m.where('role', '==', 'SUPER_ADMIN')))
      )
      for (const adminDoc of adminQ.docs) {
        await addDoc(collection(db, 'notifications'), {
          userId:    adminDoc.id,
          title:     'Deal Confirmed by Investor',
          message:   `${user.firstName} ${user.lastName} confirmed a $${amount.toLocaleString()} platform deal.`,
          type:      'SUCCESS',
          read:      false,
          createdAt: serverTimestamp(),
        })
      }

      setRequest(prev => prev ? { ...prev, deal: { ...prev.deal!, status: 'CONFIRMED' } } : prev)
      toast.success(`Deal confirmed! You are now a Platform Partner. +20 points earned!`)
    } catch (e) {
      console.error(e)
      toast.error('Failed to confirm deal')
    }
    setConfirming(false)
  }

  const STATUS_CFG = {
    PENDING:  { icon: Clock,         color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',   label: 'Under Review' },
    ACCEPTED: { icon: CheckCircle2,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Accepted' },
    REJECTED: { icon: XCircle,       color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',       label: 'Declined' },
  }

  if (loading) {
    return (
      <DashboardLayout role="INVESTOR" title="Work with Platform" subtitle="Partner directly with the platform owner">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="INVESTOR" title="Work with Platform" subtitle="Partner directly with the platform owner">
      <div className="max-w-2xl space-y-6">

        {/* Hero */}
        <div className="gradient-border p-6 flex items-start gap-5"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)' }}>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-600/20 flex items-center justify-center flex-shrink-0">
            <Crown className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Direct Partnership</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Work directly with the platform owner. Send your pitch, discuss terms over chat, and confirm a custom deal with exclusive <strong className="text-amber-400">Platform Partner</strong> status.
            </p>
          </div>
        </div>

        {/* No request yet — show submit form */}
        {!request && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6 space-y-4">
            <h4 className="font-semibold">Send Your Pitch</h4>
            <textarea
              value={pitch}
              onChange={e => setPitch(e.target.value)}
              rows={5}
              placeholder="Describe your investment goals, what you're looking for, the amount you have in mind, and why you want to work directly with the platform..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-none"
            />
            <button onClick={handleSubmit} disabled={submitting || !pitch.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-obsidian-950 text-sm font-semibold transition-all disabled:opacity-60">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Request
            </button>
          </motion.div>
        )}

        {/* Request exists — show status */}
        {request && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Status card */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">Your Request</p>
                {(() => {
                  const s = STATUS_CFG[request.status]
                  return (
                    <span className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border', s.color, s.bg)}>
                      <s.icon className="w-3.5 h-3.5" />{s.label}
                    </span>
                  )
                })()}
              </div>
              <p className="text-sm text-muted-foreground italic">"{request.message}"</p>
              {request.adminNote && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Reply from admin:</p>
                  <p className="text-sm text-brand-300">"{request.adminNote}"</p>
                </div>
              )}
            </div>

            {/* Deal offer */}
            {request.deal && (
              <div className={cn(
                'glass-card rounded-2xl p-5 border',
                request.deal.status === 'CONFIRMED'
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-brand-500/30 bg-brand-500/5',
              )}>
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-4 h-4 text-brand-400" />
                  <p className="font-semibold text-sm">
                    {request.deal.status === 'CONFIRMED' ? 'Deal Confirmed' : 'Deal Offer from Platform'}
                  </p>
                  {request.deal.status === 'CONFIRMED' && (
                    <span className="ml-auto text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-bold font-mono text-brand-400">{fmt(request.deal.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expected ROI</p>
                    <p className="font-bold font-mono text-emerald-400">{request.deal.expectedROI}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lock Period</p>
                    <p className="font-bold font-mono text-foreground">{request.deal.lockPeriod}mo</p>
                  </div>
                </div>
                {request.deal.status === 'PENDING_CONFIRM' && (
                  <button onClick={handleConfirmDeal} disabled={confirming}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 text-sm font-bold transition-all disabled:opacity-60">
                    {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Confirm Deal — funds deducted from wallet
                  </button>
                )}
              </div>
            )}

            {/* Chat — visible only when accepted */}
            {request.status === 'ACCEPTED' && request.chatId && (
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
                  <MessageSquare className="w-4 h-4 text-brand-400" />
                  <p className="font-semibold text-sm">Chat with Platform</p>
                </div>

                <div className="h-72 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground mt-8">No messages yet. Say hello!</p>
                  )}
                  {messages.map(m => {
                    const isMine = m.senderId === user?.id
                    return (
                      <div key={m.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                          'max-w-[75%] px-3 py-2 rounded-2xl text-sm',
                          isMine
                            ? 'bg-brand-500/20 text-foreground rounded-br-sm'
                            : 'bg-obsidian-800 text-foreground rounded-bl-sm',
                        )}>
                          {!isMine && <p className="text-xs text-amber-400 font-semibold mb-0.5">{m.senderName}</p>}
                          <p>{m.text}</p>
                          <p className="text-xs text-muted-foreground/50 mt-1 text-right">{fmtTime(m.createdAt)}</p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                <div className="flex gap-2 p-3 border-t border-border">
                  <input
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Type a message…"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/40"
                  />
                  <button onClick={handleSendMessage} disabled={sending || !msgText.trim()}
                    className="w-9 h-9 rounded-xl bg-brand-500 hover:bg-brand-400 text-obsidian-950 flex items-center justify-center transition-all disabled:opacity-50">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Rejected — allow re-apply */}
            {request.status === 'REJECTED' && (
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground mb-3">Your request was declined. You can submit a new one.</p>
                <button onClick={() => setRequest(null)}
                  className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm border border-border transition-all">
                  Submit New Request
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}
