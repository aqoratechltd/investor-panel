'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuthStore } from '@/stores/auth.store'
import {
  Building2, ArrowLeft, TrendingUp, Users, DollarSign,
  Shield, Clock, CheckCircle2, BarChart3, MessageSquare,
  Globe, Loader2, AlertCircle, X, CandlestickChart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Business } from '../page'

interface CandleBar { time: number; open: number; high: number; low: number; close: number }

function CandleChart({ data }: { data: CandleBar[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef     = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return
    let chart: any
    const init = async () => {
      const { createChart } = await import('lightweight-charts')
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null }
      chart = createChart(containerRef.current!, {
        width: containerRef.current!.offsetWidth,
        height: 200,
        layout: { background: { color: 'transparent' }, textColor: '#94a3b8' },
        grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
        timeScale: { borderColor: '#1e293b', timeVisible: false },
        rightPriceScale: { borderColor: '#1e293b' },
      })
      chartRef.current = chart
      const series = (chart as any).addCandlestickSeries({
        upColor: '#10b981', downColor: '#ef4444',
        borderUpColor: '#10b981', borderDownColor: '#ef4444',
        wickUpColor: '#10b981', wickDownColor: '#ef4444',
      })
      series.setData(data)
      chart.timeScale().fitContent()
    }
    init()
    return () => { chartRef.current?.remove(); chartRef.current = null }
  }, [data])

  return <div ref={containerRef} className="w-full" />
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

const RISK_COLORS: Record<string, string> = {
  Low:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Medium: 'text-amber-400  bg-amber-500/10  border-amber-500/20',
  High:   'text-red-400    bg-red-500/10    border-red-500/20',
}

export default function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const { user } = useAuthStore()

  const [business, setBusiness]     = useState<Business | null>(null)
  const [loading, setLoading]       = useState(true)
  const [contacting, setContacting] = useState(false)

  // Investment modal
  const [showInvestModal, setShowInvestModal] = useState(false)
  const [investAmount, setInvestAmount]       = useState('')
  const [investNote, setInvestNote]           = useState('')
  const [submitting, setSubmitting]           = useState(false)
  const [existingInvestment, setExistingInvestment] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { doc, getDoc, updateDoc, increment } = await import('firebase/firestore')
        const snap = await getDoc(doc(db, 'businesses', id as string))
        if (snap.exists()) {
          setBusiness({ id: snap.id, ...snap.data() } as Business)
          updateDoc(doc(db, 'businesses', id as string), { viewCount: increment(1) }).catch(() => {})
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [id])

  // Check if already has an investment request
  useEffect(() => {
    if (!user || !id) return
    const load = async () => {
      const { db } = await import('@/lib/firebase')
      const { collection, query, where, getDocs } = await import('firebase/firestore')
      const q = query(
        collection(db, 'investments'),
        where('businessId', '==', id),
        where('investorId', '==', user.id),
      )
      const snap = await getDocs(q)
      if (!snap.empty) setExistingInvestment({ id: snap.docs[0].id, ...snap.docs[0].data() })
    }
    load().catch(() => {})
  }, [user?.id, id]) // eslint-disable-line react-hooks/exhaustive-deps


  const handleContactSeller = async () => {
    if (!user || !business) return
    setContacting(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, query, where, getDocs, addDoc, serverTimestamp } = await import('firebase/firestore')

      const q = query(
        collection(db, 'chats'),
        where('businessId', '==', business.id),
        where('investorId', '==', user.id),
      )
      const existing = await getDocs(q)

      let newChatId: string
      if (!existing.empty) {
        newChatId = existing.docs[0].id
      } else {
        // Direct-to-Market: invest unlocked immediately on chat creation, no threshold required.
        // TO RE-ENABLE: Set investUnlocked: false and restore the 10-message gate in chat pages.
        const chatRef = await addDoc(collection(db, 'chats'), {
          businessId:   business.id,
          businessName: business.name,
          investorId:   user.id,
          investorName: `${user.firstName} ${user.lastName}`,
          sellerId:     business.sellerId,
          sellerName:   business.sellerName,
          lastMessage:  '',
          lastMessageAt: serverTimestamp(),
          createdAt:    serverTimestamp(),
          unreadSeller: 0,
          unreadInvestor: 0,
          messageCount: 0,
          investUnlocked: true,
        })
        newChatId = chatRef.id
      }

      router.push(`/investor/chat?chatId=${newChatId}`)
    } catch (e) {
      toast.error('Could not start conversation')
    }
    setContacting(false)
  }

  const handleSubmitInvestment = async () => {
    if (!user || !business) return
    const amount = parseFloat(investAmount)
    if (!amount || isNaN(amount)) return toast.error('Enter a valid amount')
    if (amount < (business.minInvestment ?? 0)) {
      return toast.error(`Minimum investment is ${fmt(business.minInvestment ?? 0)}`)
    }
    if (amount > business.askingAmount) {
      return toast.error(`Cannot exceed asking amount of ${fmt(business.askingAmount)}`)
    }

    setSubmitting(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, addDoc, doc, getDoc, updateDoc, increment, setDoc, serverTimestamp } = await import('firebase/firestore')

      // Check wallet balance
      const flagsSnap = await getDoc(doc(db, 'user_flags', user.id))
      const coinBalance = flagsSnap.exists() ? (flagsSnap.data().coinBalance ?? 0) : 0
      if (coinBalance < amount) {
        toast.error(`Insufficient wallet balance. You have $${coinBalance.toLocaleString()}.`)
        setSubmitting(false)
        return
      }

      // Deduct from wallet
      await updateDoc(doc(db, 'user_flags', user.id), { coinBalance: increment(-amount) })

      // Create investment as APPROVED immediately
      const ref = await addDoc(collection(db, 'investments'), {
        businessId:    business.id,
        businessName:  business.name,
        sellerId:      business.sellerId,
        sellerName:    business.sellerName,
        investorId:    user.id,
        investorName:  `${user.firstName} ${user.lastName}`,
        investorEmail: user.email,
        amount,
        equityOffered: business.equityOffered,
        expectedROI:   business.expectedROI,
        lockPeriod:    business.lockPeriod,
        note:          investNote,
        status:        'APPROVED',
        createdAt:     serverTimestamp(),
        approvedAt:    serverTimestamp(),
      })

      // Log wallet transaction
      await addDoc(collection(db, 'coin_ledger'), {
        userId:      user.id,
        type:        'INVESTMENT',
        amount:      -amount,
        description: `Investment in ${business.name}`,
        referenceId: ref.id,
        createdAt:   serverTimestamp(),
      })

      // Award points + badge to investor
      await setDoc(doc(db, 'user_flags', user.id), {
        points:    increment(5),
        userId:    user.id,
        userName:  `${user.firstName} ${user.lastName}`,
      }, { merge: true })

      await addDoc(collection(db, 'badges'), {
        userId:       user.id,
        userName:     `${user.firstName} ${user.lastName}`,
        type:         'INVESTOR',
        label:        'Active Investor',
        businessName: business.name,
        amount,
        earnedAt:     serverTimestamp(),
      })

      // Notify investor
      await addDoc(collection(db, 'notifications'), {
        userId:    user.id,
        title:     'Investment Confirmed!',
        message:   `Your $${amount.toLocaleString()} investment in ${business.name} is live. You earned +5 points and a badge!`,
        type:      'SUCCESS',
        read:      false,
        createdAt: serverTimestamp(),
      })

      // Notify seller
      await addDoc(collection(db, 'notifications'), {
        userId:    business.sellerId,
        title:     'New Investment Received',
        message:   `${user.firstName} ${user.lastName} invested $${amount.toLocaleString()} in ${business.name}.`,
        type:      'SUCCESS',
        read:      false,
        createdAt: serverTimestamp(),
      })

      // Increment business interest count
      await updateDoc(doc(db, 'businesses', business.id), { interestedCount: increment(1) })

      setExistingInvestment({ id: ref.id, amount, status: 'APPROVED' })
      setShowInvestModal(false)
      toast.success(`Investment of $${amount.toLocaleString()} confirmed!`)
    } catch (e) {
      console.error(e)
      toast.error('Failed to submit investment')
    }
    setSubmitting(false)
  }

  if (loading) return (
    <DashboardLayout role="INVESTOR">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    </DashboardLayout>
  )

  if (!business) return (
    <DashboardLayout role="INVESTOR">
      <div className="p-8 flex flex-col items-center justify-center gap-4 h-64">
        <AlertCircle className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-muted-foreground">Business not found</p>
        <button onClick={() => router.back()} className="text-sm text-brand-400 hover:underline">Go back</button>
      </div>
    </DashboardLayout>
  )

  const minInv = business.minInvestment ?? 0

  return (
    <DashboardLayout role="INVESTOR">
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </button>

        {/* Hero card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-8 h-8 text-brand-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display">{business.name}</h1>
                {business.tagline && <p className="text-muted-foreground text-sm mt-0.5 italic">"{business.tagline}"</p>}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-white/5">{business.category}</span>
                  <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-white/5">{business.industry}</span>
                  <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-white/5">{business.country}</span>
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', RISK_COLORS[business.riskLevel] || RISK_COLORS.Medium)}>
                    {business.riskLevel} Risk
                  </span>
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleContactSeller}
                disabled={contacting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 border border-border text-sm font-medium transition-all disabled:opacity-60"
              >
                {contacting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                {contacting ? 'Opening…' : 'Contact Seller'}
              </button>

              {/* Invest Now button */}
              {existingInvestment ? (
                <div className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border',
                  existingInvestment.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  'bg-red-500/10 text-red-400 border-red-500/20',
                )}>
                  <CheckCircle2 className="w-4 h-4" />
                  {existingInvestment.status === 'APPROVED' ? `Invested ${fmt(existingInvestment.amount)}` : 'Investment Rejected'}
                </div>
              ) : (
                <button
                  onClick={() => setShowInvestModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 text-sm font-bold transition-all"
                >
                  <TrendingUp className="w-4 h-4" /> Invest Now
                </button>
              )}
            </div>
          </div>

        </motion.div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: DollarSign,  label: 'Asking Amount',   value: fmt(business.askingAmount),  color: 'text-brand-400' },
            { icon: TrendingUp,  label: 'Expected ROI',    value: `${business.expectedROI}%`,  color: 'text-emerald-400' },
            { icon: Shield,      label: 'Investment Type', value: business.investmentType,      color: 'text-violet-400' },
            { icon: Clock,       label: 'Lock Period',     value: `${business.lockPeriod}mo`,  color: 'text-amber-400' },
          ].map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="glass-card rounded-2xl p-4 text-center">
              <m.icon className={cn('w-5 h-5 mx-auto mb-2', m.color)} />
              <p className={cn('text-xl font-bold font-mono', m.color)}>{m.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — About + Financials */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold mb-3">About the Business</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{business.description}</p>
              {business.website && (
                <a href={business.website} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 mt-3 transition-colors">
                  <Globe className="w-3.5 h-3.5" /> {business.website}
                </a>
              )}
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold mb-4">Financial Metrics</h2>
              {/* Candlestick chart if graph data exists */}
            {(business as any).candleData?.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="font-semibold mb-1 flex items-center gap-2">
                  <CandlestickChart className="w-4 h-4 text-brand-400" /> Performance Chart
                </h2>
                <p className="text-xs text-muted-foreground mb-4">Historical price movement</p>
                <CandleChart data={(business as any).candleData} />
              </div>
            )}

          <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'TTM Revenue',       value: fmt(business.ttmRevenue),             color: 'text-emerald-400' },
                  { label: 'TTM Profit',         value: fmt(business.ttmProfit),              color: 'text-emerald-400' },
                  { label: 'Last Month Revenue', value: fmt(business.lastMonthRevenue ?? 0),  color: 'text-brand-400' },
                  { label: 'Last Month Profit',  value: fmt(business.lastMonthProfit ?? 0),   color: 'text-brand-400' },
                  { label: 'Total Customers',    value: business.customers?.toLocaleString(), color: 'text-violet-400' },
                  { label: 'Annual Growth',      value: `+${business.annualGrowthRate}%`,     color: 'text-emerald-400' },
                  { label: 'Equity Offered',     value: `${business.equityOffered}%`,         color: 'text-brand-400' },
                  { label: 'Min Investment',     value: fmt(business.minInvestment),          color: 'text-foreground' },
                ].map(m => (
                  <div key={m.label} className="bg-obsidian-800/60 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">{m.label}</p>
                    <p className={cn('text-sm font-bold font-mono', m.color)}>{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-6">
            {business.highlights?.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="font-semibold mb-4">Key Highlights</h2>
                <div className="space-y-3">
                  {business.highlights.map((h: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{h}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold mb-4">Business Details</h2>
              <div className="space-y-3">
                {[
                  { label: 'Founded',      value: business.founded },
                  { label: 'Company Size', value: business.companySize },
                  { label: 'Country',      value: business.country },
                  { label: 'Seller',       value: business.sellerName },
                ].map(f => (
                  <div key={f.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="font-medium">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            {existingInvestment ? (
              <div className={cn(
                'w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border text-sm font-semibold',
                existingInvestment.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                'bg-red-500/10 text-red-400 border-red-500/20',
              )}>
                <CheckCircle2 className="w-4 h-4" />
                {existingInvestment.status === 'APPROVED' ? `Invested ${fmt(existingInvestment.amount)}` : 'Investment Rejected'}
              </div>
            ) : (
              <button
                onClick={() => setShowInvestModal(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 font-bold transition-all"
              >
                <TrendingUp className="w-4 h-4" /> Invest Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Investment Modal */}
      <AnimatePresence>
        {showInvestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowInvestModal(false) }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-obsidian-900 border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold">Invest in {business.name}</h3>
                    <p className="text-xs text-muted-foreground">Funds deducted from wallet instantly</p>
                  </div>
                </div>
                <button onClick={() => setShowInvestModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Deal summary */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { label: 'Asking',  value: fmt(business.askingAmount),   color: 'text-brand-400' },
                  { label: 'ROI',     value: `${business.expectedROI}%`,   color: 'text-emerald-400' },
                  { label: 'Equity',  value: `${business.equityOffered}%`, color: 'text-violet-400' },
                ].map(m => (
                  <div key={m.label} className="bg-obsidian-800 rounded-xl p-3 text-center">
                    <p className={cn('text-sm font-bold font-mono', m.color)}>{m.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Amount input */}
              <div className="mb-4">
                <label className="block text-xs text-muted-foreground mb-1.5">
                  Investment Amount <span className="text-brand-400">(min {fmt(minInv)})</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    type="number"
                    value={investAmount}
                    onChange={e => setInvestAmount(e.target.value)}
                    placeholder={minInv.toString()}
                    min={minInv}
                    max={business.askingAmount}
                    className="w-full bg-obsidian-800 border border-border rounded-xl pl-7 pr-4 py-3 text-sm font-mono focus:outline-none focus:border-brand-500/50 transition-colors"
                  />
                </div>
                {investAmount && parseFloat(investAmount) >= minInv && (
                  <p className="text-xs text-emerald-400 mt-1.5">
                    Projected return: ~{fmt(parseFloat(investAmount) * (1 + business.expectedROI / 100))} after {business.lockPeriod} months
                  </p>
                )}
              </div>

              <div className="mb-5">
                <label className="block text-xs text-muted-foreground mb-1.5">Note to Admin (optional)</label>
                <textarea
                  value={investNote}
                  onChange={e => setInvestNote(e.target.value)}
                  placeholder="Why you want to invest in this business…"
                  rows={3}
                  className="w-full bg-obsidian-800 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500/50 transition-colors resize-none"
                />
              </div>

              <p className="text-xs text-muted-foreground/60 mb-4 bg-obsidian-800/50 rounded-xl p-3 border border-border/50">
                Your request will be reviewed by the Super Admin. You will be notified once approved or rejected. No funds are transferred until approval.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowInvestModal(false)}
                  className="flex-1 py-3 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-sm font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitInvestment}
                  disabled={submitting || !investAmount || parseFloat(investAmount) < minInv}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                  {submitting ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
