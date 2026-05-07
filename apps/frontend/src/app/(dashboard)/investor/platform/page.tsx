'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Loader2, BrainCircuit, ShieldCheck, MessageSquare,
  Sparkles, CheckCheck,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

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
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const STARTER_PROMPTS = [
  'I want to learn more about how the platform works',
  'I need help with my investment strategy',
  'I have a question about fees and returns',
  'How do I get started with my first investment?',
]

export default function InvestorPlatformPage() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<PlatformMessage[]>([])
  const [text, setText]         = useState('')
  const [sending, setSending]   = useState(false)
  const [loading, setLoading]   = useState(true)
  const [chatId, setChatId]     = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    const id = `platform_${user.id}`
    setChatId(id)
    let unsub: () => void

    const setup = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const {
          doc, getDoc, setDoc, collection, query,
          orderBy, onSnapshot, serverTimestamp, updateDoc,
        } = await import('firebase/firestore')

        const chatRef = doc(db, 'platform_chats', id)
        const snap    = await getDoc(chatRef)
        if (!snap.exists()) {
          await setDoc(chatRef, {
            investorId:    user.id,
            investorName:  `${user.firstName} ${user.lastName}`,
            investorEmail: user.email,
            lastMessage:   '',
            lastMessageAt: serverTimestamp(),
            unreadAdmin:   0,
            unreadInvestor: 0,
            status:        'OPEN',
            createdAt:     serverTimestamp(),
          })
        }
        await updateDoc(chatRef, { unreadInvestor: 0 }).catch(() => {})

        const q = query(
          collection(db, 'platform_chats', id, 'messages'),
          orderBy('createdAt', 'asc'),
        )
        unsub = onSnapshot(q, (s) => {
          setMessages(s.docs.map(d => ({ id: d.id, ...d.data() }) as PlatformMessage))
          setLoading(false)
          updateDoc(chatRef, { unreadInvestor: 0 }).catch(() => {})
        })
      } catch (e) {
        console.error('[PlatformChat]', e)
        setLoading(false)
      }
    }

    setup()
    return () => { unsub?.() }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (msg = text.trim()) => {
    if (!msg || !chatId || !user || sending) return
    setText('')
    setSending(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, addDoc, doc, updateDoc, serverTimestamp, increment } = await import('firebase/firestore')
      await addDoc(collection(db, 'platform_chats', chatId, 'messages'), {
        senderId:   user.id,
        senderName: `${user.firstName} ${user.lastName}`,
        senderRole: 'INVESTOR',
        text:       msg,
        createdAt:  serverTimestamp(),
      })
      await updateDoc(doc(db, 'platform_chats', chatId), {
        lastMessage:   msg,
        lastMessageAt: serverTimestamp(),
        unreadAdmin:   increment(1),
        unreadInvestor: 0,
      })
    } catch {
      toast.error('Failed to send message')
    }
    setSending(false)
  }

  return (
    <DashboardLayout role="INVESTOR">
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

        {/* ── Left info panel ── */}
        <div className="hidden lg:flex w-80 flex-shrink-0 flex-col border-r border-border bg-obsidian-950 p-6 gap-6">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
              <BrainCircuit className="w-6 h-6 text-brand-400" />
            </div>
            <h2 className="font-display font-bold text-lg">Work with Platform</h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Direct line to the InvestorPanel admin team. Ask anything about investments, fees, or strategy.
            </p>
          </div>

          <div className="glass-card rounded-xl p-4 flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-violet-400" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-obsidian-900 bg-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">Platform Admin</p>
              <p className="text-xs text-amber-400">Usually replies within 24h</p>
            </div>
          </div>

          {messages.length === 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick starts</p>
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="w-full text-left text-xs p-3 rounded-xl border border-border hover:border-brand-500/30 hover:bg-brand-500/5 text-muted-foreground hover:text-foreground transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Chat area ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center gap-3 bg-obsidian-950 flex-shrink-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-violet-400" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-obsidian-900 bg-amber-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Platform Support</p>
              <p className="text-xs text-muted-foreground">InvestorPanel Admin Team</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20">
              <Sparkles className="w-3 h-3 text-brand-400" />
              <span className="text-xs text-brand-400 font-medium">Secure Channel</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full gap-4 text-center p-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 text-brand-400" />
                </div>
                <div>
                  <p className="font-semibold">Start the conversation</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Ask anything about the platform, investments, or how we can help you grow.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full max-w-sm lg:hidden">
                  {STARTER_PROMPTS.slice(0, 2).map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSend(p)}
                      className="w-full text-left text-xs p-3 rounded-xl border border-border hover:border-brand-500/30 hover:bg-brand-500/5 text-muted-foreground hover:text-foreground transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isMe = msg.senderRole === 'INVESTOR'
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
                    >
                      {!isMe && (
                        <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                        </div>
                      )}
                      <div className={cn(
                        'max-w-[72%] rounded-2xl px-4 py-2.5',
                        isMe
                          ? 'bg-brand-500 text-obsidian-950 rounded-br-sm'
                          : 'bg-obsidian-800 text-foreground rounded-bl-sm border border-border',
                      )}>
                        {!isMe && (
                          <p className="text-[10px] font-semibold text-violet-400 mb-1">Platform Admin</p>
                        )}
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <div className={cn('flex items-center gap-1 mt-1', isMe ? 'justify-end' : 'justify-start')}>
                          <p className={cn('text-[10px]', isMe ? 'text-obsidian-950/60' : 'text-muted-foreground')}>
                            {fmtTime(msg.createdAt)}
                          </p>
                          {isMe && <CheckCheck className="w-3 h-3 text-obsidian-950/60" />}
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
                      <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl rounded-br-sm bg-brand-500/30">
                        <span className="text-xs text-brand-300">Sending…</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-obsidian-950 flex-shrink-0">
            <div className="flex items-center gap-3">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                }}
                placeholder="Type your message to the platform team…"
                className="flex-1 bg-obsidian-800 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500/50 transition-colors"
              />
              <button
                onClick={() => handleSend()}
                disabled={!text.trim() || sending}
                className="w-11 h-11 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-40 flex items-center justify-center transition-all flex-shrink-0"
              >
                {sending
                  ? <Loader2 className="w-4 h-4 text-obsidian-950 animate-spin" />
                  : <Send className="w-4 h-4 text-obsidian-950" />
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
