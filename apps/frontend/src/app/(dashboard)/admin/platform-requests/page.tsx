'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuthStore } from '@/stores/auth.store'
import {
  Crown, CheckCircle2, XCircle, Clock, MessageSquare,
  Send, Loader2, DollarSign, TrendingUp, Lock, X, User, Plus,
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

function fmtDate(v: any) {
  if (!v) return '—'
  const d = v?.toDate ? v.toDate() : new Date(v)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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

const STATUS_CFG = {
  PENDING:  { label: 'Pending',  icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  ACCEPTED: { label: 'Accepted', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  REJECTED: { label: 'Declined', icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
}

export default function AdminPlatformRequestsPage() {
  const { user } = useAuthStore()
  const [requests, setRequests]       = useState<PlatformRequest[]>([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState<PlatformRequest | null>(null)
  const [messages, setMessages]       = useState<Message[]>([])
  const [msgText, setMsgText]         = useState('')
  const [sending, setSending]         = useState(false)
  const [processing, setProcessing]   = useState<string | null>(null)
  const [adminNote, setAdminNote]     = useState('')
  const [showDealForm, setShowDealForm] = useState(false)
  const [deal, setDeal] = useState({ amount: 0, expectedROI: 0, lockPeriod: 12 })
  const [creatingDeal, setCreatingDeal] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const unsubRef  = useRef<() => void>()

  // Load all requests (realtime)
  useEffect(() => {
    const sub = async () => {
      const { db } = await import('@/lib/firebase')
      const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore')
      const q = query(collection(db, 'platform_requests'), orderBy('createdAt', 'desc'))
      const unsub = onSnapshot(q, snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }) as PlatformRequest)
        setRequests(list)
        // Sync selected if open
        setSelected(prev => prev ? (list.find(r => r.id === prev.id) ?? prev) : null)
        setLoading(false)
      })
      return unsub
    }
    let unsub: () => void
    sub().then(u => { unsub = u }).catch(() => setLoading(false))
    return () => unsub?.()
  }, [])

  // Subscribe to messages when a request with chatId is selected
  useEffect(() => {
    unsubRef.current?.()
    if (!selected?.chatId) { setMessages([]); return }
    let unsub: () => void
    const sub = async () => {
      const { db } = await import('@/lib/firebase')
      const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore')
      const q = query(collection(db, 'chats', selected.chatId!, 'messages'), orderBy('createdAt', 'asc'))
      unsub = onSnapshot(q, snap => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Message))
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      // Mark read
      const { doc, updateDoc } = await import('firebase/firestore')
      await updateDoc(doc(db, 'chats', selected.chatId!), { unreadAdmin: 0 }).catch(() => {})
    }
    sub()
    return () => unsubRef.current?.()
  }, [selected?.chatId])

  const handleAccept = async (req: PlatformRequest) => {
    if (!user) return
    setProcessing(req.id)
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc, addDoc, collection, serverTimestamp } = await import('firebase/firestore')

      // Create chat room
      const chatRef = await addDoc(collection(db, 'chats'), {
        type:           'PLATFORM_DIRECT',
        adminId:        user.id,
        adminName:      `${user.firstName} ${user.lastName}`,
        investorId:     req.investorId,
        investorName:   req.investorName,
        lastMessage:    '',
        lastMessageAt:  serverTimestamp(),
        unreadAdmin:    0,
        unreadInvestor: 0,
        createdAt:      serverTimestamp(),
      })

      await updateDoc(doc(db, 'platform_requests', req.id), {
        status:    'ACCEPTED',
        adminNote: adminNote.trim() || null,
        chatId:    chatRef.id,
        updatedAt: serverTimestamp(),
      })

      // Notify investor
      await addDoc(collection(db, 'notifications'), {
        userId:    req.investorId,
        title:     'Your Request Was Accepted!',
        message:   `The platform owner accepted your partnership request. You can now chat and discuss terms.`,
        type:      'SUCCESS',
        read:      false,
        createdAt: serverTimestamp(),
      })

      setAdminNote('')
      toast.success(`Accepted ${req.investorName}'s request`)
    } catch (e) {
      console.error(e)
      toast.error('Failed to accept request')
    }
    setProcessing(null)
  }

  const handleReject = async (req: PlatformRequest) => {
    if (!user) return
    setProcessing(req.id)
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc, addDoc, collection, serverTimestamp } = await import('firebase/firestore')

      await updateDoc(doc(db, 'platform_requests', req.id), {
        status:    'REJECTED',
        adminNote: adminNote.trim() || null,
        updatedAt: serverTimestamp(),
      })

      await addDoc(collection(db, 'notifications'), {
        userId:    req.investorId,
        title:     'Partnership Request Update',
        message:   adminNote.trim() || 'Your platform partnership request was not accepted at this time.',
        type:      'INFO',
        read:      false,
        createdAt: serverTimestamp(),
      })

      setAdminNote('')
      toast.success('Request declined')
    } catch (e) {
      toast.error('Failed to decline request')
    }
    setProcessing(null)
  }

  const handleSendMessage = async () => {
    if (!user || !selected?.chatId || !msgText.trim()) return
    setSending(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, addDoc, doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
      const text = msgText.trim()
      setMsgText('')
      await addDoc(collection(db, 'chats', selected.chatId, 'messages'), {
        senderId:   user.id,
        senderName: `${user.firstName} ${user.lastName}`,
        text,
        createdAt:  serverTimestamp(),
      })
      await updateDoc(doc(db, 'chats', selected.chatId), {
        lastMessage:    text,
        lastMessageAt:  serverTimestamp(),
        unreadInvestor: 1,
        unreadAdmin:    0,
      })
    } catch (e) {
      toast.error('Failed to send message')
    }
    setSending(false)
  }

  const handleCreateDeal = async () => {
    if (!user || !selected) return
    if (deal.amount <= 0)     { toast.error('Enter a valid amount'); return }
    if (deal.expectedROI <= 0){ toast.error('Enter expected ROI'); return }
    setCreatingDeal(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc, addDoc, collection, serverTimestamp } = await import('firebase/firestore')

      await updateDoc(doc(db, 'platform_requests', selected.id), {
        deal: { ...deal, status: 'PENDING_CONFIRM' },
        updatedAt: serverTimestamp(),
      })

      await addDoc(collection(db, 'notifications'), {
        userId:    selected.investorId,
        title:     'Platform Deal Offer',
        message:   `You have a new deal offer: ${fmt(deal.amount)} at ${deal.expectedROI}% ROI, ${deal.lockPeriod} month lock. Go to Platform page to confirm.`,
        type:      'SUCCESS',
        read:      false,
        createdAt: serverTimestamp(),
      })

      setShowDealForm(false)
      setDeal({ amount: 0, expectedROI: 0, lockPeriod: 12 })
      toast.success('Deal offer sent to investor')
    } catch (e) {
      toast.error('Failed to create deal')
    }
    setCreatingDeal(false)
  }

  const counts = {
    PENDING:  requests.filter(r => r.status === 'PENDING').length,
    ACCEPTED: requests.filter(r => r.status === 'ACCEPTED').length,
    REJECTED: requests.filter(r => r.status === 'REJECTED').length,
  }

  return (
    <DashboardLayout role="SUPER_ADMIN">
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-400" /> Platform Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Investors requesting to work directly with you.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pending',  value: counts.PENDING,  color: 'text-amber-400' },
            { label: 'Accepted', value: counts.ACCEPTED, color: 'text-emerald-400' },
            { label: 'Declined', value: counts.REJECTED, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="glass-card rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={cn('text-2xl font-bold font-display', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Crown className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No platform requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req, i) => {
              const st = STATUS_CFG[req.status]
              return (
                <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    'glass-card rounded-2xl p-5 cursor-pointer transition-colors',
                    selected?.id === req.id ? 'ring-1 ring-brand-500/40' : 'hover:bg-white/[0.04]',
                  )}
                  onClick={() => setSelected(req)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-brand-400">
                        {req.investorName?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{req.investorName}</p>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', st.color, st.bg)}>
                            {st.label}
                          </span>
                          {req.deal?.status === 'CONFIRMED' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                              Partner
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{req.investorEmail} · {fmtDate(req.createdAt)}</p>
                        <p className="text-sm text-muted-foreground mt-1 italic line-clamp-2">"{req.message}"</p>
                      </div>
                    </div>
                    {req.status === 'ACCEPTED' && req.chatId && (
                      <div className="flex items-center gap-1 text-xs text-brand-400 flex-shrink-0">
                        <MessageSquare className="w-3.5 h-3.5" /> Chat
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Side Panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setSelected(null)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-obsidian-950 border-l border-border z-50 flex flex-col">

              {/* Header */}
              <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-obsidian-950/90 backdrop-blur-sm flex-shrink-0">
                <div>
                  <p className="font-bold">{selected.investorName}</p>
                  <p className="text-xs text-muted-foreground">{selected.investorEmail}</p>
                </div>
                <div className="flex items-center gap-2">
                  {(() => { const s = STATUS_CFG[selected.status]; return (
                    <span className={cn('text-xs px-2 py-1 rounded-full border font-medium', s.color, s.bg)}>{s.label}</span>
                  )})()}
                  <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Pitch */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Their Pitch</p>
                  <p className="text-sm text-foreground leading-relaxed bg-white/5 rounded-xl px-4 py-3 italic">"{selected.message}"</p>
                </div>

                {/* Actions for PENDING */}
                {selected.status === 'PENDING' && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Response (optional)</p>
                    <textarea
                      value={adminNote}
                      onChange={e => setAdminNote(e.target.value)}
                      rows={2}
                      placeholder="Add a note to the investor…"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/40 resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleAccept(selected)} disabled={processing === selected.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm border border-emerald-500/20 transition-all disabled:opacity-50">
                        {processing === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Accept & Open Chat
                      </button>
                      <button onClick={() => handleReject(selected)} disabled={processing === selected.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm border border-red-500/20 transition-all disabled:opacity-50">
                        <XCircle className="w-4 h-4" /> Decline
                      </button>
                    </div>
                  </div>
                )}

                {/* Accepted — chat + deal */}
                {selected.status === 'ACCEPTED' && selected.chatId && (
                  <>
                    {/* Deal section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deal</p>
                        {!selected.deal && !showDealForm && (
                          <button onClick={() => setShowDealForm(true)}
                            className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors">
                            <Plus className="w-3.5 h-3.5" /> Create Deal
                          </button>
                        )}
                      </div>

                      {selected.deal ? (
                        <div className={cn(
                          'rounded-xl p-4 border',
                          selected.deal.status === 'CONFIRMED'
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-brand-500/5 border-brand-500/20',
                        )}>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Amount</p>
                              <p className="font-bold font-mono text-brand-400">{fmt(selected.deal.amount)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">ROI</p>
                              <p className="font-bold font-mono text-emerald-400">{selected.deal.expectedROI}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Lock</p>
                              <p className="font-bold font-mono">{selected.deal.lockPeriod}mo</p>
                            </div>
                          </div>
                          <p className={cn('text-xs mt-2 font-medium', selected.deal.status === 'CONFIRMED' ? 'text-emerald-400' : 'text-amber-400')}>
                            {selected.deal.status === 'CONFIRMED' ? '✓ Confirmed by investor' : '⏳ Awaiting investor confirmation'}
                          </p>
                        </div>
                      ) : showDealForm ? (
                        <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Amount ($)</label>
                              <input type="number" value={deal.amount || ''} onChange={e => setDeal(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/40" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">ROI (%)</label>
                              <input type="number" value={deal.expectedROI || ''} onChange={e => setDeal(p => ({ ...p, expectedROI: parseFloat(e.target.value) || 0 }))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/40" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Lock (mo)</label>
                              <input type="number" value={deal.lockPeriod || ''} onChange={e => setDeal(p => ({ ...p, lockPeriod: parseInt(e.target.value) || 12 }))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/40" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleCreateDeal} disabled={creatingDeal}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-obsidian-950 text-sm font-semibold disabled:opacity-60 transition-all">
                              {creatingDeal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />}
                              Send Offer
                            </button>
                            <button onClick={() => setShowDealForm(false)}
                              className="px-3 rounded-lg bg-white/5 hover:bg-white/10 text-sm border border-white/10 transition-all">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No deal created yet. Click "Create Deal" when ready.</p>
                      )}
                    </div>

                    {/* Chat */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Chat</p>
                      <div className="bg-obsidian-900 rounded-xl overflow-hidden">
                        <div className="h-52 overflow-y-auto p-3 space-y-2">
                          {messages.length === 0 && (
                            <p className="text-center text-xs text-muted-foreground mt-6">Start the conversation</p>
                          )}
                          {messages.map(m => {
                            const isMine = m.senderId === user?.id
                            return (
                              <div key={m.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                                <div className={cn(
                                  'max-w-[80%] px-3 py-2 rounded-2xl text-sm',
                                  isMine ? 'bg-brand-500/20 rounded-br-sm' : 'bg-obsidian-800 rounded-bl-sm',
                                )}>
                                  {!isMine && <p className="text-xs text-amber-400 font-semibold mb-0.5">{m.senderName}</p>}
                                  <p>{m.text}</p>
                                  <p className="text-xs text-muted-foreground/40 mt-0.5 text-right">{fmtTime(m.createdAt)}</p>
                                </div>
                              </div>
                            )
                          })}
                          <div ref={bottomRef} />
                        </div>
                        <div className="flex gap-2 p-2 border-t border-border">
                          <input value={msgText} onChange={e => setMsgText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                            placeholder="Type a message…"
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/40" />
                          <button onClick={handleSendMessage} disabled={sending || !msgText.trim()}
                            className="w-9 h-9 rounded-xl bg-brand-500 hover:bg-brand-400 text-obsidian-950 flex items-center justify-center disabled:opacity-50 transition-all">
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
