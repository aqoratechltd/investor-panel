'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Star, TrendingUp, Users, DollarSign, BarChart3,
  X, ChevronDown, SlidersHorizontal, Zap, Building2, Coins,
  Shield, AlertTriangle, Info, Send, Trophy, MessageCircle,
  ShieldCheck, CheckCheck, Loader2, BrainCircuit,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'
import { useMarketplaceStore, type MarketAsset } from '@/stores/marketplace.store'
import { useAuthStore } from '@/stores/auth.store'
import { TradingChart, generateOHLC } from '@/components/charts/trading-chart'
import { CurrencySwitcher } from '@/components/ui/currency-switcher'
import { useCurrencyStore } from '@/stores/currency.store'

const CHART_CACHE: Record<string, ReturnType<typeof generateOHLC>> = {}
function getAssetChart(id: string, price: number) {
  if (!CHART_CACHE[id]) CHART_CACHE[id] = generateOHLC(price, 180, 0.03, 0.0006)
  return CHART_CACHE[id]
}

// ── Risk Badge ───────────────────────────────────────────────
function RiskBadge({ level }: { level: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  const config = {
    LOW: { label: 'Low Risk', className: 'badge-profit', icon: Shield },
    MEDIUM: { label: 'Med Risk', className: 'badge-warning', icon: BarChart3 },
    HIGH: { label: 'High Risk', className: 'badge-loss', icon: AlertTriangle },
  }[level]
  const Icon = config.icon
  return (
    <span className={cn(config.className, 'flex items-center gap-1')}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

// ── Asset Card ───────────────────────────────────────────────
function AssetCard({
  asset,
  index,
  onContactSeller,
  onViewChart,
}: {
  asset: MarketAsset
  index: number
  onContactSeller: (asset: MarketAsset) => void
  onViewChart: (asset: MarketAsset) => void
}) {
  const isPositive = asset.returnRate >= 0
  const { format } = useCurrencyStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        'relative rounded-2xl p-5 border flex flex-col gap-4 cursor-default',
        'bg-gradient-to-br from-white/[0.04] to-white/[0.01]',
        asset.isTopPerforming
          ? 'border-amber-500/40 shadow-[0_0_24px_rgba(245,158,11,0.15)]'
          : 'border-white/8 hover:border-white/15',
        'transition-all duration-300',
      )}
    >
      {/* Top Performing Badge */}
      {asset.isTopPerforming && (
        <div className="absolute -top-2.5 left-4 flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 text-[10px] font-bold uppercase tracking-wider">
          <Trophy className="w-2.5 h-2.5" />
          Top Performing
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{ backgroundColor: asset.iconColor + '22', border: `1px solid ${asset.iconColor}44` }}
          >
            <span style={{ color: asset.iconColor }}>
              {asset.type === 'COIN' ? <Coins className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm leading-tight">{asset.name}</h3>
              {asset.isTopPerforming && (
                <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground font-mono">{asset.symbol}</span>
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-md font-medium',
                asset.type === 'COIN'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-brand-500/10 text-brand-400 border border-brand-500/20',
              )}>
                {asset.type}
              </span>
            </div>
          </div>
        </div>

        {/* Return Rate */}
        <div className={cn(
          'flex items-center gap-1 text-sm font-bold font-mono px-2.5 py-1 rounded-xl border flex-shrink-0',
          isPositive
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border-red-500/20',
        )}>
          <TrendingUp className="w-3.5 h-3.5" />
          {formatPercent(asset.returnRate)} p.a.
        </div>
      </div>

      {/* Seller */}
      <p className="text-xs text-muted-foreground">
        <span className="text-foreground/60">By</span>{' '}
        <span className="text-brand-400 font-medium">{asset.sellerCompany}</span>
        <span className="mx-1 text-border">·</span>
        <span className="text-xs">{asset.category}</span>
      </p>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
        {asset.description}
      </p>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <p className="text-[10px] text-muted-foreground mb-0.5">Score</p>
          <p className="text-sm font-bold font-mono text-brand-400">
            {asset.performanceScore.toFixed(1)}
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <p className="text-[10px] text-muted-foreground mb-0.5">Investors</p>
          <p className="text-sm font-bold font-mono">{asset.totalInvestors.toLocaleString()}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <p className="text-[10px] text-muted-foreground mb-0.5">Min. Invest</p>
          <p className="text-sm font-bold font-mono text-emerald-400">
            ${asset.minInvestment >= 1000 ? `${asset.minInvestment / 1000}k` : asset.minInvestment}
          </p>
        </div>
      </div>

      {/* Price + Risk */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground">Current Price</p>
          <p className="text-base font-bold font-mono">{format(asset.currentPrice)}</p>
        </div>
        <RiskBadge level={asset.riskLevel} />
      </div>

      {/* Mini Sparkline */}
      <div className="flex items-end gap-px h-8">
        {asset.priceHistory.slice(-20).map((pt, i, arr) => {
          const max = Math.max(...arr.map((p) => p.value))
          const min = Math.min(...arr.map((p) => p.value))
          const range = max - min || 1
          const heightPct = ((pt.value - min) / range) * 100
          return (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-sm transition-all',
                isPositive ? 'bg-emerald-500/30' : 'bg-red-500/30',
              )}
              style={{ height: `${Math.max(10, heightPct)}%` }}
            />
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onViewChart(asset)}
        >
          <BarChart3 className="w-3.5 h-3.5 mr-1" />
          View Chart
        </Button>
        <Button
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onContactSeller(asset)}
        >
          <Send className="w-3.5 h-3.5 mr-1" />
          Contact Seller
        </Button>
      </div>
    </motion.div>
  )
}

// ── Contact Modal ─────────────────────────────────────────────
function ContactModal({
  asset,
  onClose,
}: {
  asset: MarketAsset
  onClose: () => void
}) {
  const { user } = useAuthStore()
  const { submitInquiry } = useMarketplaceStore()

  const [form, setForm] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    phone: '',
    email: user?.email || '',
    amount: '',
    thesis: '',
    history: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.phone.trim()) e.phone = 'Phone is required'
    if (!form.email.trim()) e.email = 'Email is required'
    if (!form.amount || isNaN(Number(form.amount))) e.amount = 'Valid amount required'
    if (form.thesis.length < 200) e.thesis = `Min 200 chars (${form.thesis.length}/200)`
    if (!form.history.trim()) e.history = 'Portfolio history is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    submitInquiry({
      assetId: asset.id,
      assetName: asset.name,
      assetType: asset.type,
      sellerId: asset.sellerId,
      sellerName: asset.sellerName,
      investorId: user?.id || 'guest',
      investorName: form.name,
      phone: form.phone,
      email: form.email,
      investmentThesis: form.thesis,
      portfolioHistory: form.history,
      requestedAmount: Number(form.amount),
    })
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10"
        style={{
          background: 'linear-gradient(135deg, hsl(222 44% 8%) 0%, hsl(222 44% 6%) 100%)',
        }}
      >
        {submitted ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-display font-bold mb-2">Inquiry Submitted!</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Your inquiry for <strong className="text-foreground">{asset.name}</strong> has been sent to{' '}
              <strong className="text-brand-400">{asset.sellerCompany}</strong>. They will review and respond shortly.
            </p>
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: asset.iconColor + '22', border: `1px solid ${asset.iconColor}44` }}
                >
                  {asset.type === 'COIN' ? (
                    <Coins className="w-5 h-5" style={{ color: asset.iconColor }} />
                  ) : (
                    <Building2 className="w-5 h-5" style={{ color: asset.iconColor }} />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold">{asset.name}</h2>
                  <p className="text-xs text-muted-foreground">Contact {asset.sellerCompany}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Full Name *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="John Doe"
                    className={cn(
                      'w-full h-10 px-3 rounded-xl text-sm border bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all',
                      errors.name ? 'border-red-500/50' : 'border-white/10',
                    )}
                  />
                  {errors.name && <p className="text-red-400 text-[11px] mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Phone *
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className={cn(
                      'w-full h-10 px-3 rounded-xl text-sm border bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all',
                      errors.phone ? 'border-red-500/50' : 'border-white/10',
                    )}
                  />
                  {errors.phone && <p className="text-red-400 text-[11px] mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Email *
                  </label>
                  <input
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="investor@email.com"
                    className={cn(
                      'w-full h-10 px-3 rounded-xl text-sm border bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all',
                      errors.email ? 'border-red-500/50' : 'border-white/10',
                    )}
                  />
                  {errors.email && <p className="text-red-400 text-[11px] mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Investment Amount (USD) *
                  </label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => set('amount', e.target.value)}
                    placeholder={`Min $${asset.minInvestment.toLocaleString()}`}
                    min={asset.minInvestment}
                    className={cn(
                      'w-full h-10 px-3 rounded-xl text-sm border bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all font-mono',
                      errors.amount ? 'border-red-500/50' : 'border-white/10',
                    )}
                  />
                  {errors.amount && <p className="text-red-400 text-[11px] mt-1">{errors.amount}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Investment Thesis * <span className="text-muted-foreground normal-case tracking-normal">(min 200 characters)</span>
                </label>
                <textarea
                  value={form.thesis}
                  onChange={(e) => set('thesis', e.target.value)}
                  rows={5}
                  placeholder="Describe your investment rationale, why this asset aligns with your strategy, expected outcomes, and how this fits your overall portfolio goals..."
                  className={cn(
                    'w-full px-3 py-2.5 rounded-xl text-sm border bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all resize-none',
                    errors.thesis ? 'border-red-500/50' : 'border-white/10',
                  )}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.thesis ? (
                    <p className="text-red-400 text-[11px]">{errors.thesis}</p>
                  ) : (
                    <span />
                  )}
                  <span className={cn(
                    'text-[11px] font-mono',
                    form.thesis.length >= 200 ? 'text-emerald-400' : 'text-muted-foreground',
                  )}>
                    {form.thesis.length}/200
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Previous Portfolio History *
                </label>
                <textarea
                  value={form.history}
                  onChange={(e) => set('history', e.target.value)}
                  rows={4}
                  placeholder="Describe your investment history, previous exits, current holdings, total AUM managed, and any relevant fund or angel experience..."
                  className={cn(
                    'w-full px-3 py-2.5 rounded-xl text-sm border bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all resize-none',
                    errors.history ? 'border-red-500/50' : 'border-white/10',
                  )}
                />
                {errors.history && <p className="text-red-400 text-[11px] mt-1">{errors.history}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button className="flex-1 gap-2" onClick={handleSubmit}>
                  <Send className="w-4 h-4" />
                  Submit Inquiry
                </Button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

// ── Platform Chat Widget ──────────────────────────────────────
interface WidgetMessage {
  id: string
  senderRole: 'USER' | 'ADMIN'
  senderName: string
  text: string
  createdAt: any
}

function PlatformChatWidget() {
  const { user }                        = useAuthStore()
  const [open, setOpen]                 = useState(false)
  const [messages, setMessages]         = useState<WidgetMessage[]>([])
  const [text, setText]                 = useState('')
  const [sending, setSending]           = useState(false)
  const [chatReady, setChatReady]       = useState(false)
  const [unread, setUnread]             = useState(0)
  // Guest fields
  const [guestName, setGuestName]       = useState('')
  const [guestEmail, setGuestEmail]     = useState('')
  const [guestStarted, setGuestStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const chatId = user ? `platform_${user.id}` : null

  // Load chat for logged-in users
  useEffect(() => {
    if (!user || !open) return
    let unsub: () => void
    const setup = async () => {
      const id = `platform_${user.id}`
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
        const q = query(collection(db, 'platform_chats', id, 'messages'), orderBy('createdAt', 'asc'))
        unsub = onSnapshot(q, (s) => {
          setMessages(s.docs.map(d => ({ id: d.id, ...d.data() }) as WidgetMessage))
          updateDoc(chatRef, { unreadInvestor: 0 }).catch(() => {})
          setChatReady(true)
        })
      } catch (e) { console.error(e); setChatReady(true) }
    }
    setup()
    return () => { unsub?.() }
  }, [user?.id, open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Poll unread count when widget is closed (logged-in only)
  useEffect(() => {
    if (!user || open) return
    const poll = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { doc, getDoc } = await import('firebase/firestore')
        const snap = await getDoc(doc(db, 'platform_chats', `platform_${user.id}`))
        if (snap.exists()) setUnread(snap.data().unreadInvestor ?? 0)
      } catch {}
    }
    poll()
  }, [user?.id, open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const sendMessage = async (msg: string) => {
    if (!msg.trim() || sending) return
    setSending(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, addDoc, doc, setDoc, updateDoc, serverTimestamp, increment, getDoc } = await import('firebase/firestore')

      if (user) {
        const id = `platform_${user.id}`
        await addDoc(collection(db, 'platform_chats', id, 'messages'), {
          senderId:   user.id,
          senderName: `${user.firstName} ${user.lastName}`,
          senderRole: 'USER',
          text:       msg,
          createdAt:  serverTimestamp(),
        })
        await updateDoc(doc(db, 'platform_chats', id), {
          lastMessage:   msg,
          lastMessageAt: serverTimestamp(),
          unreadAdmin:   increment(1),
          unreadInvestor: 0,
        })
      } else {
        // Guest: create/append to guest chat
        const guestId = `guest_${guestEmail.replace(/[^a-z0-9]/gi, '_')}`
        const chatRef = doc(db, 'platform_chats', guestId)
        const snap    = await getDoc(chatRef)
        if (!snap.exists()) {
          await setDoc(chatRef, {
            investorId:    guestId,
            investorName:  guestName,
            investorEmail: guestEmail,
            lastMessage:   '',
            lastMessageAt: serverTimestamp(),
            unreadAdmin:   0,
            unreadInvestor: 0,
            status:        'OPEN',
            isGuest:       true,
            createdAt:     serverTimestamp(),
          })
        }
        const newMsg: WidgetMessage = {
          id:         `local_${Date.now()}`,
          senderRole: 'USER',
          senderName: guestName,
          text:       msg,
          createdAt:  new Date(),
        }
        setMessages(prev => [...prev, newMsg])
        await addDoc(collection(db, 'platform_chats', guestId, 'messages'), {
          senderId:   guestId,
          senderName: guestName,
          senderRole: 'USER',
          text:       msg,
          createdAt:  serverTimestamp(),
        })
        await updateDoc(chatRef, {
          lastMessage:   msg,
          lastMessageAt: serverTimestamp(),
          unreadAdmin:   increment(1),
        })
      }
    } catch (e) { console.error(e) }
    setSending(false)
  }

  const handleSend = async () => {
    const msg = text.trim()
    if (!msg) return
    setText('')
    await sendMessage(msg)
  }

  const showGuestForm = !user && !guestStarted
  const showChat      = user ? chatReady : guestStarted

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(o => !o); setUnread(0) }}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl transition-all duration-300',
          'bg-brand-500 hover:bg-brand-400 text-obsidian-950 font-semibold text-sm',
          open && 'opacity-0 pointer-events-none',
        )}
        style={{ boxShadow: '0 8px 32px rgba(6,182,212,0.4)' }}
      >
        <BrainCircuit className="w-4 h-4" />
        Work With Platform
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-background">
            {unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 overflow-hidden flex flex-col"
            style={{
              height: '520px',
              background: 'linear-gradient(180deg, #0a1628 0%, #0d1f36 100%)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/8 flex-shrink-0">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-violet-400" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 bg-amber-400" style={{ borderColor: '#0a1628' }} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Platform Support</p>
                <p className="text-xs text-amber-400">InvestorPanel Admin · Replies in 24h</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            {showGuestForm ? (
              <div className="flex-1 flex flex-col justify-center p-6 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-6 h-6 text-brand-400" />
                  </div>
                  <p className="font-semibold">Chat with our team</p>
                  <p className="text-xs text-muted-foreground mt-1">Introduce yourself to get started</p>
                </div>
                <input
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-10 px-3 rounded-xl border border-white/10 bg-white/[0.04] text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-all"
                />
                <input
                  value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)}
                  placeholder="Your email"
                  type="email"
                  className="w-full h-10 px-3 rounded-xl border border-white/10 bg-white/[0.04] text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-all"
                />
                <button
                  disabled={!guestName.trim() || !guestEmail.trim()}
                  onClick={() => setGuestStarted(true)}
                  className="w-full h-10 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-40 text-obsidian-950 font-semibold text-sm transition-all"
                >
                  Start Chatting
                </button>
              </div>
            ) : showChat ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                      <MessageCircle className="w-8 h-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">
                        Hi {user ? user.firstName : guestName}! How can we help you today?
                      </p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isMe = msg.senderRole === 'USER'
                    return (
                      <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                        {!isMe && (
                          <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center mr-1.5 mt-1 flex-shrink-0">
                            <ShieldCheck className="w-3 h-3 text-violet-400" />
                          </div>
                        )}
                        <div className={cn(
                          'max-w-[80%] rounded-2xl px-3 py-2',
                          isMe
                            ? 'bg-brand-500 text-obsidian-950 rounded-br-sm text-sm'
                            : 'bg-white/[0.06] text-foreground rounded-bl-sm border border-white/8 text-sm',
                        )}>
                          {!isMe && (
                            <p className="text-[9px] font-semibold text-violet-400 mb-0.5">Platform Admin</p>
                          )}
                          <p>{msg.text}</p>
                          {isMe && <CheckCheck className="w-2.5 h-2.5 text-obsidian-950/50 ml-auto mt-0.5" />}
                        </div>
                      </div>
                    )
                  })}
                  <AnimatePresence>
                    {sending && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-end"
                      >
                        <div className="px-3 py-2 rounded-2xl rounded-br-sm bg-brand-500/30">
                          <Loader2 className="w-3.5 h-3.5 text-brand-300 animate-spin" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-white/8 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      value={text}
                      onChange={e => setText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                      placeholder="Type a message…"
                      className="flex-1 h-10 px-3 rounded-xl border border-white/10 bg-white/[0.04] text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-all"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!text.trim() || sending}
                      className="w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-40 flex items-center justify-center transition-all flex-shrink-0"
                    >
                      <Send className="w-3.5 h-3.5 text-obsidian-950" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function MarketplacePage() {
  const { assets, filter, setFilter, initialize, isLoaded } = useMarketplaceStore()
  const { user } = useAuthStore()
  const { format } = useCurrencyStore()
  const [search, setSearch] = useState('')

  useEffect(() => { if (!isLoaded) initialize() }, [isLoaded, initialize])
  const [chartAsset, setChartAsset] = useState<MarketAsset | null>(null)
  const [contactAsset, setContactAsset] = useState<MarketAsset | null>(null)

  // Filter chips
  const CHIP_OPTIONS = [
    { label: 'All', value: 'ALL' },
    { label: 'Coins', value: 'COIN' },
    { label: 'Companies', value: 'COMPANY' },
  ] as const

  const filteredAssets = useMemo(() => {
    let result = [...assets]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.symbol.toLowerCase().includes(q) ||
          a.sellerCompany.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q),
      )
    }

    if (filter.type !== 'ALL') {
      result = result.filter((a) => a.type === filter.type)
    }

    if (filter.risk !== 'ALL') {
      result = result.filter((a) => a.riskLevel === filter.risk)
    }

    if (filter.minReturn > 0) {
      result = result.filter((a) => a.returnRate >= filter.minReturn)
    }

    result.sort((a, b) => {
      switch (filter.sort) {
        case 'returnRate': return b.returnRate - a.returnRate
        case 'volume': return b.volume - a.volume
        case 'newest': return b.id.localeCompare(a.id)
        default: return b.performanceScore - a.performanceScore
      }
    })

    return result
  }, [assets, search, filter])

  const topPerformers = assets.filter((a) => a.isTopPerforming).length

  return (
    <div className="min-h-screen bg-background" style={{ background: 'linear-gradient(180deg, #080f1e 0%, #0a1628 50%, #080f1e 100%)' }}>
      {/* Header */}
      <header className="border-b border-white/8 sticky top-0 z-40 backdrop-blur-xl bg-background/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <span className="text-sm font-bold font-display text-brand-400">InvestorPanel</span>
              <span className="text-sm text-muted-foreground ml-1.5">Marketplace</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href={user.role === 'SELLER' ? '/seller' : '/investor'}>
                <Button size="sm" variant="glass">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
            <CurrencySwitcher />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-xs font-medium mb-4">
            <Star className="w-3 h-3 fill-current" />
            {topPerformers} Top Performing Assets Available
          </div>
          <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4 leading-tight">
            Discover{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-emerald-400">
              High-Performance
            </span>
            <br />
            Investment Opportunities
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Access curated assets from top-rated sellers — coins, companies, and funds — all
            verified and performance-scored in real time.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="max-w-2xl mx-auto mb-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets, companies, categories..."
              className="w-full h-14 pl-12 pr-4 rounded-2xl border border-white/10 bg-white/[0.04] text-base focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all"
            />
          </div>
        </motion.div>

        {/* Filter Chips */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-8"
        >
          {CHIP_OPTIONS.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setFilter({ type: chip.value as typeof filter.type })}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200',
                filter.type === chip.value
                  ? 'bg-brand-500 text-obsidian-950 border-brand-500'
                  : 'border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 bg-white/[0.03]',
              )}
            >
              {chip.label}
            </button>
          ))}
          <button
            onClick={() => setFilter({ type: 'ALL' })}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 flex items-center gap-1.5',
              'border-amber-500/30 text-amber-400 hover:bg-amber-500/10 bg-amber-500/5',
            )}
          >
            <Star className="w-3 h-3 fill-current" />
            Top Performing
          </button>
        </motion.div>

        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center gap-3 mb-8 p-4 rounded-2xl border border-white/8 bg-white/[0.02]"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters:</span>
          </div>

          {/* Risk Filter */}
          <div className="relative">
            <select
              value={filter.risk}
              onChange={(e) => setFilter({ risk: e.target.value })}
              className="h-8 pl-3 pr-8 rounded-lg border border-white/10 bg-white/[0.03] text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-brand-500/50 cursor-pointer"
            >
              <option value="ALL">All Risk</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Min Return Slider */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Min Return:</span>
            <input
              type="range"
              min={0}
              max={50}
              step={1}
              value={filter.minReturn}
              onChange={(e) => setFilter({ minReturn: Number(e.target.value) })}
              className="w-24 accent-brand-500 cursor-pointer"
            />
            <span className="text-xs font-mono text-brand-400 w-10">
              {filter.minReturn}%+
            </span>
          </div>

          {/* Sort */}
          <div className="relative ml-auto">
            <select
              value={filter.sort}
              onChange={(e) => setFilter({ sort: e.target.value })}
              className="h-8 pl-3 pr-8 rounded-lg border border-white/10 bg-white/[0.03] text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-brand-500/50 cursor-pointer"
            >
              <option value="performanceScore">Sort: Performance Score</option>
              <option value="returnRate">Sort: Return Rate</option>
              <option value="volume">Sort: Volume</option>
              <option value="newest">Sort: Newest</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Results count */}
          <span className="text-xs text-muted-foreground">
            {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''}
          </span>
        </motion.div>

        {/* Asset Grid */}
        {filteredAssets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-muted-foreground"
          >
            <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No assets found</p>
            <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredAssets.map((asset, i) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                index={i}
                onContactSeller={setContactAsset}
                onViewChart={setChartAsset}
              />
            ))}
          </div>
        )}
      </section>

      {/* Contact Modal */}
      <AnimatePresence>
        {contactAsset && (
          <ContactModal asset={contactAsset} onClose={() => setContactAsset(null)} />
        )}
      </AnimatePresence>

      {/* Platform Chat Widget */}
      <PlatformChatWidget />

      {/* Chart Modal */}
      <AnimatePresence>
        {chartAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setChartAsset(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl bg-obsidian-900 border border-white/10 rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ background: `${chartAsset.iconColor}22`, color: chartAsset.iconColor }}
                  >
                    {chartAsset.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-display font-bold">{chartAsset.name}</p>
                    <p className="text-xs text-muted-foreground">{chartAsset.sellerCompany}</p>
                  </div>
                </div>
                <button
                  onClick={() => setChartAsset(null)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5">
                <TradingChart
                  data={getAssetChart(chartAsset.id, chartAsset.currentPrice)}
                  symbol={chartAsset.symbol}
                  height={360}
                  showVolume
                  showTimeframes
                  showTypeToggle
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
