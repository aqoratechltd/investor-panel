'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuthStore } from '@/stores/auth.store'
import {
  MessageSquare, Send, User, ArrowLeft, Loader2,
  AlertTriangle, ShieldOff, TrendingUp, Lock, Unlock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { checkMessage } from '@/lib/moderation'
import toast from 'react-hot-toast'

interface ChatRoom {
  id: string
  businessId: string
  businessName: string
  sellerId: string
  sellerName: string
  investorId: string
  investorName: string
  lastMessage: string
  lastMessageAt: any
  unreadSeller: number
  messageCount?: number
  investUnlocked?: boolean
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
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(v: any) {
  if (!v) return ''
  const d = v?.toDate ? v.toDate() : new Date(v)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 86400) return fmtTime(v)
  if (diff < 604800) return d.toLocaleDateString('en-US', { weekday: 'short' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const UNLOCK_THRESHOLD = 10

export default function SellerInboxPage() {
  const { user } = useAuthStore()
  const searchParams = useSearchParams()
  const initialChatId = searchParams.get('chatId')

  const [rooms, setRooms]       = useState<ChatRoom[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeId, setActiveId] = useState<string | null>(initialChatId)
  const [text, setText]         = useState('')
  const [sending, setSending]   = useState(false)
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const bottomRef = useRef<HTMLDivElement>(null)

  const [warningModal, setWarningModal] = useState<{ open: boolean; details: string; label: string } | null>(null)
  const [isBlocked, setIsBlocked] = useState(false)
  const [violationCount, setViolationCount] = useState(0)

  const activeRoom = rooms.find(r => r.id === activeId)
  const msgCount = activeRoom?.messageCount ?? 0
  const investUnlocked = activeRoom?.investUnlocked || msgCount >= UNLOCK_THRESHOLD

  // Load user block/violation status
  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { db } = await import('@/lib/firebase')
      const { doc, getDoc } = await import('firebase/firestore')
      const snap = await getDoc(doc(db, 'user_flags', user.id))
      if (snap.exists()) {
        const data = snap.data()
        setViolationCount(data.violationCount ?? 0)
        setIsBlocked(data.isBlocked ?? false)
      }
    }
    load().catch(() => {})
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load seller's chat rooms
  useEffect(() => {
    if (!user) return
    let unsub: () => void
    const setup = async () => {
      const { db } = await import('@/lib/firebase')
      const { collection, query, where, onSnapshot } = await import('firebase/firestore')
      const q = query(collection(db, 'chats'), where('sellerId', '==', user.id))
      unsub = onSnapshot(q, snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }) as ChatRoom)
        list.sort((a, b) => {
          const ta = a.lastMessageAt?.toDate?.()?.getTime?.() ?? 0
          const tb = b.lastMessageAt?.toDate?.()?.getTime?.() ?? 0
          return tb - ta
        })
        setRooms(list)
        setLoadingRooms(false)
      })
    }
    setup()
    return () => { unsub?.() }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load messages
  useEffect(() => {
    if (!activeId) return
    let unsub: () => void
    const setup = async () => {
      const { db } = await import('@/lib/firebase')
      const { collection, query, orderBy, onSnapshot, doc, updateDoc } = await import('firebase/firestore')
      const q = query(collection(db, 'chats', activeId, 'messages'), orderBy('createdAt', 'asc'))
      unsub = onSnapshot(q, snap => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Message))
        updateDoc(doc(db, 'chats', activeId), { unreadSeller: 0 }).catch(() => {})
      })
    }
    setup()
    return () => { unsub?.() }
  }, [activeId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (initialChatId && rooms.length > 0) {
      setActiveId(initialChatId)
      setMobileView('chat')
    }
  }, [initialChatId, rooms])

  const handleSend = async () => {
    if (!text.trim() || !activeId || !user || sending) return
    if (isBlocked) {
      toast.error('Your account has been restricted from messaging.')
      return
    }

    const msg = text.trim()

    // --- Moderation check ---
    const violation = checkMessage(msg)
    if (violation) {
      const newCount = violationCount + 1
      setViolationCount(newCount)

      const { db } = await import('@/lib/firebase')
      const { doc, setDoc, serverTimestamp, addDoc, collection } = await import('firebase/firestore')

      await setDoc(doc(db, 'user_flags', user.id), {
        violationCount: newCount,
        isBlocked: newCount >= 2,
        lastViolation: violation.type,
        lastViolationAt: serverTimestamp(),
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
      }, { merge: true })

      await addDoc(collection(db, 'violations'), {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        role: 'SELLER',
        chatId: activeId,
        message: msg,
        violationType: violation.type,
        violationLabel: violation.label,
        createdAt: serverTimestamp(),
      })

      if (newCount >= 2) {
        setIsBlocked(true)
        toast.error('Your account has been blocked due to repeated violations.')
        return
      }

      setText('')
      setWarningModal({ open: true, label: violation.label, details: violation.details })
      return
    }

    // Seller can manually unlock investment for investor
    setText('')
    setSending(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, addDoc, doc, updateDoc, serverTimestamp, increment } = await import('firebase/firestore')
      await addDoc(collection(db, 'chats', activeId, 'messages'), {
        senderId:   user.id,
        senderName: `${user.firstName} ${user.lastName}`,
        text:       msg,
        createdAt:  serverTimestamp(),
      })
      await updateDoc(doc(db, 'chats', activeId), {
        lastMessage:    msg,
        lastMessageAt:  serverTimestamp(),
        unreadInvestor: increment(1),
        unreadSeller:   0,
        messageCount:   increment(1),
      })
    } catch (e) { console.error(e) }
    setSending(false)
  }

  const handleUnlockInvestment = async () => {
    if (!activeId) return
    const { db } = await import('@/lib/firebase')
    const { doc, updateDoc } = await import('firebase/firestore')
    await updateDoc(doc(db, 'chats', activeId), { investUnlocked: true })
    toast.success('Investment unlocked for this investor!')
  }

  const selectRoom = (id: string) => {
    setActiveId(id)
    setMobileView('chat')
  }

  return (
    <DashboardLayout role="SELLER">
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

        {/* Chat list */}
        <div className={cn(
          'w-full md:w-80 flex-shrink-0 border-r border-border flex flex-col bg-obsidian-950',
          mobileView === 'chat' ? 'hidden md:flex' : 'flex',
        )}>
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">Inbox</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Messages from investors</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingRooms ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 p-4 text-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No messages yet.<br />Investors will message you when interested in your business.</p>
              </div>
            ) : (
              rooms.map(room => (
                <button key={room.id} onClick={() => selectRoom(room.id)}
                  className={cn(
                    'w-full p-4 text-left hover:bg-white/5 transition-colors border-b border-border/50',
                    activeId === room.id && 'bg-brand-500/5 border-l-2 border-l-brand-500',
                  )}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold truncate">{room.investorName}</p>
                        <p className="text-xs text-muted-foreground flex-shrink-0">{fmtDate(room.lastMessageAt)}</p>
                      </div>
                      <p className="text-xs text-brand-400 truncate mt-0.5">{room.businessName}</p>
                      {room.lastMessage && (
                        <p className="text-xs text-muted-foreground/70 truncate mt-1">{room.lastMessage}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {(room.investUnlocked || (room.messageCount ?? 0) >= UNLOCK_THRESHOLD) ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <Unlock className="w-3 h-3" /> Invest unlocked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground/50">
                            <Lock className="w-3 h-3" /> {room.messageCount ?? 0}/{UNLOCK_THRESHOLD} msgs
                          </span>
                        )}
                        {room.unreadSeller > 0 && (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-500 text-obsidian-950 text-xs font-bold">
                            {room.unreadSeller}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className={cn('flex-1 flex flex-col', mobileView === 'list' ? 'hidden md:flex' : 'flex')}>
          {activeRoom ? (
            <>
              <div className="p-4 border-b border-border flex items-center gap-3 bg-obsidian-950">
                <button onClick={() => setMobileView('list')} className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{activeRoom.investorName}</p>
                  <p className="text-xs text-brand-400">{activeRoom.businessName}</p>
                </div>
                {/* Seller manual unlock */}
                {!investUnlocked && (
                  <button
                    onClick={handleUnlockInvestment}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-obsidian-800 hover:bg-emerald-500/10 hover:text-emerald-400 text-muted-foreground text-xs border border-border transition-all"
                  >
                    <Unlock className="w-3.5 h-3.5" /> Unlock Invest
                  </button>
                )}
                {investUnlocked && (
                  <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
                    <TrendingUp className="w-3.5 h-3.5" /> Invest Enabled
                  </span>
                )}
              </div>

              {/* Blocked banner */}
              {isBlocked && (
                <div className="mx-4 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                  <ShieldOff className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400">Your messaging access has been restricted due to policy violations.</p>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <MessageSquare className="w-8 h-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                  </div>
                )}
                {messages.map(msg => {
                  const isMe = msg.senderId === user?.id
                  return (
                    <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[70%] rounded-2xl px-4 py-2.5',
                        isMe
                          ? 'bg-brand-500 text-obsidian-950 rounded-br-sm'
                          : 'bg-obsidian-800 text-foreground rounded-bl-sm',
                      )}>
                        <p className="text-sm">{msg.text}</p>
                        <p className={cn('text-xs mt-1', isMe ? 'text-obsidian-950/60' : 'text-muted-foreground')}>
                          {fmtTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Progress bar */}
              {!investUnlocked && (
                <div className="px-4 pb-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Investment locked</span>
                    <span>{msgCount}/{UNLOCK_THRESHOLD} messages</span>
                  </div>
                  <div className="h-1 bg-obsidian-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-600 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (msgCount / UNLOCK_THRESHOLD) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="p-4 border-t border-border bg-obsidian-950">
                <div className="flex items-center gap-3">
                  <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder={isBlocked ? 'Messaging restricted' : 'Reply to investor…'}
                    disabled={isBlocked}
                    className="flex-1 bg-obsidian-800 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button onClick={handleSend} disabled={!text.trim() || sending || isBlocked}
                    className="w-11 h-11 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-40 flex items-center justify-center transition-all flex-shrink-0">
                    {sending ? <Loader2 className="w-4 h-4 text-obsidian-950 animate-spin" /> : <Send className="w-4 h-4 text-obsidian-950" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-brand-400" />
              </div>
              <div>
                <p className="font-semibold">Select a conversation</p>
                <p className="text-sm text-muted-foreground mt-1">Investors will appear here when they contact you about your businesses</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warning Modal */}
      <AnimatePresence>
        {warningModal?.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-obsidian-900 border border-amber-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-400">Policy Warning</h3>
                  <p className="text-sm text-muted-foreground">{warningModal.label}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{warningModal.details}</p>
              <p className="text-xs text-amber-400/80 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 mb-5">
                <strong>Warning 1 of 2:</strong> A second violation will result in your account being permanently blocked from messaging.
              </p>
              <button
                onClick={() => setWarningModal(null)}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-950 font-semibold text-sm transition-all"
              >
                I Understand — Stay On Platform
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
