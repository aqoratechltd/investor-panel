'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Loader2, ShieldCheck, MessageSquare, BrainCircuit,
  Users, Clock, CheckCheck, Search,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface PlatformChat {
  id: string
  investorId: string
  investorName: string
  investorEmail: string
  lastMessage: string
  lastMessageAt: any
  unreadAdmin: number
  status: 'OPEN' | 'CLOSED'
  createdAt: any
}

interface PlatformMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: 'INVESTOR' | 'ADMIN'
  text: string
  createdAt: any
}

function fmtTime(v: any) {
  if (!v) return ''
  const d = v?.toDate ? v.toDate() : new Date(v)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 86400) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  if (diff < 604800) return d.toLocaleDateString('en-US', { weekday: 'short' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtFull(v: any) {
  if (!v) return ''
  const d = v?.toDate ? v.toDate() : new Date(v)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function AdminPlatformRequestsPage() {
  const { user } = useAuthStore()
  const [chats, setChats]             = useState<PlatformChat[]>([])
  const [activeId, setActiveId]       = useState<string | null>(null)
  const [messages, setMessages]       = useState<PlatformMessage[]>([])
  const [text, setText]               = useState('')
  const [sending, setSending]         = useState(false)
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMsgs, setLoadingMsgs]   = useState(false)
  const [search, setSearch]           = useState('')
  const [mobileView, setMobileView]   = useState<'list' | 'chat'>('list')
  const bottomRef = useRef<HTMLDivElement>(null)

  const activeChat = chats.find(c => c.id === activeId)

  // Load all platform chats in real-time
  useEffect(() => {
    let unsub: () => void
    const setup = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore')
        const q = query(collection(db, 'platform_chats'), orderBy('lastMessageAt', 'desc'))
        unsub = onSnapshot(q, (snap) => {
          setChats(snap.docs.map(d => ({ id: d.id, ...d.data() }) as PlatformChat))
          setLoadingChats(false)
        })
      } catch (e) {
        console.error('[AdminPlatformRequests]', e)
        setLoadingChats(false)
      }
    }
    setup()
    return () => { unsub?.() }
  }, [])

  // Load messages for active chat
  useEffect(() => {
    if (!activeId) return
    setLoadingMsgs(true)
    let unsub: () => void
    const setup = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, query, orderBy, onSnapshot, doc, updateDoc } = await import('firebase/firestore')
        const q = query(
          collection(db, 'platform_chats', activeId, 'messages'),
          orderBy('createdAt', 'asc'),
        )
        unsub = onSnapshot(q, (snap) => {
          setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }) as PlatformMessage))
          setLoadingMsgs(false)
          // Mark as read for admin
          updateDoc(doc(db, 'platform_chats', activeId), { unreadAdmin: 0 }).catch(() => {})
        })
      } catch (e) {
        console.error('[AdminPlatformRequests] messages', e)
        setLoadingMsgs(false)
      }
    }
    setup()
    return () => { unsub?.() }
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectChat = (id: string) => {
    setActiveId(id)
    setMobileView('chat')
  }

  const handleSend = async () => {
    const msg = text.trim()
    if (!msg || !activeId || !user || sending) return
    setText('')
    setSending(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, addDoc, doc, updateDoc, serverTimestamp, increment } = await import('firebase/firestore')
      await addDoc(collection(db, 'platform_chats', activeId, 'messages'), {
        senderId:   user.id,
        senderName: 'Platform Admin',
        senderRole: 'ADMIN',
        text:       msg,
        createdAt:  serverTimestamp(),
      })
      await updateDoc(doc(db, 'platform_chats', activeId), {
        lastMessage:   msg,
        lastMessageAt: serverTimestamp(),
        unreadInvestor: increment(1),
        unreadAdmin:   0,
      })
    } catch {
      toast.error('Failed to send reply')
    }
    setSending(false)
  }

  const filteredChats = search.trim()
    ? chats.filter(c =>
        c.investorName.toLowerCase().includes(search.toLowerCase()) ||
        c.investorEmail.toLowerCase().includes(search.toLowerCase()),
      )
    : chats

  const totalUnread = chats.reduce((s, c) => s + (c.unreadAdmin || 0), 0)

  return (
    <DashboardLayout role="SUPER_ADMIN">
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

        {/* ── Left: chat list ── */}
        <div className={cn(
          'w-full md:w-80 flex-shrink-0 border-r border-border flex flex-col bg-obsidian-950',
          mobileView === 'chat' ? 'hidden md:flex' : 'flex',
        )}>
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  Platform Requests
                  {totalUnread > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-500 text-obsidian-950 text-xs font-bold">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{chats.length} conversations</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 text-violet-400" />
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search investors…"
                className="w-full h-9 pl-8 pr-3 text-xs rounded-xl border border-border bg-obsidian-800 focus:outline-none focus:border-brand-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto">
            {loadingChats ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 p-4 text-center">
                <Users className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {search ? 'No results found' : 'No platform requests yet'}
                </p>
              </div>
            ) : (
              filteredChats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => selectChat(chat.id)}
                  className={cn(
                    'w-full p-4 text-left hover:bg-white/5 transition-colors border-b border-border/50',
                    activeId === chat.id && 'bg-violet-500/5 border-l-2 border-l-violet-500',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-brand-400">
                      {chat.investorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold truncate">{chat.investorName}</p>
                        <p className="text-xs text-muted-foreground flex-shrink-0">{fmtTime(chat.lastMessageAt)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{chat.investorEmail}</p>
                      {chat.lastMessage && (
                        <p className="text-xs text-muted-foreground/70 truncate mt-1">{chat.lastMessage}</p>
                      )}
                      {chat.unreadAdmin > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-brand-500 text-obsidian-950 text-[10px] font-bold">
                            {chat.unreadAdmin} new
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Right: chat area ── */}
        <div className={cn(
          'flex-1 flex flex-col min-w-0',
          mobileView === 'list' ? 'hidden md:flex' : 'flex',
        )}>
          {activeChat ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-border flex items-center gap-3 bg-obsidian-950 flex-shrink-0">
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                >
                  ←
                </button>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 flex items-center justify-center text-sm font-bold text-brand-400 flex-shrink-0">
                  {activeChat.investorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{activeChat.investorName}</p>
                  <p className="text-xs text-muted-foreground">{activeChat.investorEmail}</p>
                </div>
                <span className={cn(
                  'text-[10px] font-semibold px-2 py-1 rounded-full border',
                  activeChat.status === 'OPEN'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-muted-foreground bg-white/5 border-border',
                )}>
                  {activeChat.status}
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <MessageSquare className="w-8 h-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isAdmin = msg.senderRole === 'ADMIN'
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn('flex', isAdmin ? 'justify-end' : 'justify-start')}
                        >
                          {!isAdmin && (
                            <div className="w-7 h-7 rounded-lg bg-brand-500/20 flex items-center justify-center mr-2 mt-1 flex-shrink-0 text-xs font-bold text-brand-400">
                              {activeChat.investorName.charAt(0)}
                            </div>
                          )}
                          <div className={cn(
                            'max-w-[72%] rounded-2xl px-4 py-2.5',
                            isAdmin
                              ? 'bg-violet-500 text-white rounded-br-sm'
                              : 'bg-obsidian-800 text-foreground rounded-bl-sm border border-border',
                          )}>
                            {!isAdmin && (
                              <p className="text-[10px] font-semibold text-brand-400 mb-1">{msg.senderName}</p>
                            )}
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                            <div className={cn('flex items-center gap-1 mt-1', isAdmin ? 'justify-end' : 'justify-start')}>
                              <p className={cn('text-[10px]', isAdmin ? 'text-white/60' : 'text-muted-foreground')}>
                                {fmtFull(msg.createdAt)}
                              </p>
                              {isAdmin && <CheckCheck className="w-3 h-3 text-white/60" />}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                    <AnimatePresence>
                      {sending && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex justify-end"
                        >
                          <div className="px-4 py-2.5 rounded-2xl rounded-br-sm bg-violet-500/30">
                            <span className="text-xs text-violet-300">Sending…</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* Reply input */}
              <div className="p-4 border-t border-border bg-obsidian-950 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 text-violet-400" />
                  </div>
                  <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                    }}
                    placeholder={`Reply to ${activeChat.investorName}…`}
                    className="flex-1 bg-obsidian-800 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                    className="w-11 h-11 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:opacity-40 flex items-center justify-center transition-all flex-shrink-0"
                  >
                    {sending
                      ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                      : <Send className="w-4 h-4 text-white" />
                    }
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <BrainCircuit className="w-8 h-8 text-violet-400" />
              </div>
              <div>
                <p className="font-semibold">Select a conversation</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Pick an investor from the left to view and reply to their messages
                </p>
              </div>
              {totalUnread > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20">
                  <Clock className="w-4 h-4 text-brand-400" />
                  <span className="text-sm text-brand-400 font-medium">{totalUnread} unread message{totalUnread > 1 ? 's' : ''} waiting</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
