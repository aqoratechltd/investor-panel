'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuthStore } from '@/stores/auth.store'
import { CheckCircle2, Clock, TrendingUp, User, DollarSign, Loader2, Eye, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Investment {
  id: string
  businessName: string
  investorId?: string
  investorName: string
  investorEmail: string
  amount: number
  paymentMethod: 'WALLET' | 'BANK_TRANSFER'
  status: 'APPROVED' | 'PENDING_CONFIRMATION' | 'REJECTED'
  screenshotBase64?: string
  screenshotName?: string
  note?: string
  createdAt: any
}

function fmt(n: number) {
  if (n >= 1_00_00_000) return `₨${(n / 1_00_00_000).toFixed(1)} Cr`
  if (n >= 1_00_000)    return `₨${(n / 1_00_000).toFixed(1)} L`
  if (n >= 1_000)       return `₨${(n / 1_000).toFixed(0)}K`
  return `₨${n.toLocaleString('en-PK')}`
}

export default function SellerInvestmentsPage() {
  const { user } = useAuthStore()
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [previewImg, setPreviewImg] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore')
        const q = query(collection(db, 'investments'), where('sellerId', '==', user.id))
        const snap = await getDocs(q)
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Investment)
        list.sort((a, b) => {
          const ta = a.createdAt?.toDate?.()?.getTime?.() ?? 0
          const tb = b.createdAt?.toDate?.()?.getTime?.() ?? 0
          return tb - ta
        })
        setInvestments(list)
      } catch (e: any) {
        console.error('[SellerInvestments]', e)
        toast.error('Failed to load investments')
      }
      setLoading(false)
    }
    load()
  }, [user])

  const handleConfirm = async (inv: Investment) => {
    if (!user) return
    setConfirming(inv.id)
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc, addDoc, collection, serverTimestamp, setDoc, increment } = await import('firebase/firestore')

      // Mark investment as APPROVED
      await updateDoc(doc(db, 'investments', inv.id), {
        status: 'APPROVED',
        approvedAt: serverTimestamp(),
      })

      // Bank transfer confirmed — credit seller's available balance immediately
      await setDoc(doc(db, 'user_flags', user.id), {
        coinBalance: increment(inv.amount),
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
      }, { merge: true })
      // Also update business total received
      await updateDoc(doc(db, 'businesses', inv.businessId ?? ''), { confirmedInvestments: increment(inv.amount) }).catch(() => {})

      // Notify investor
      await addDoc(collection(db, 'notifications'), {
        userId: inv.investorId ?? '',
        title: 'Investment Confirmed!',
        message: `Your bank transfer of ${fmt(inv.amount)} for ${inv.businessName} has been confirmed by the seller.`,
        type: 'SUCCESS',
        read: false,
        createdAt: serverTimestamp(),
      })

      setInvestments(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'APPROVED' } : i))
      toast.success(`Confirmed! ${fmt(inv.amount)} added to your account.`)
    } catch (e: any) {
      console.error(e)
      toast.error('Failed to confirm investment')
    }
    setConfirming(null)
  }

  const pending = investments.filter(i => i.status === 'PENDING_CONFIRMATION')
  const confirmed = investments.filter(i => i.status === 'APPROVED')

  return (
    <DashboardLayout role="SELLER">
      <div className="p-6 lg:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold font-display">Investments</h1>
          <p className="text-sm text-muted-foreground mt-1">Confirm bank transfer payments from investors</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pending Confirmation', value: pending.length, color: 'text-amber-400' },
            { label: 'Confirmed', value: confirmed.length, color: 'text-emerald-400' },
            { label: 'Total Received', value: fmt(confirmed.reduce((s, i) => s + i.amount, 0)), color: 'text-brand-400' },
          ].map(s => (
            <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
              <p className={cn('text-2xl font-bold font-display', s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Pending confirmations */}
            {pending.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Awaiting Your Confirmation ({pending.length})
                </h2>
                <div className="space-y-3">
                  {pending.map((inv, i) => (
                    <motion.div key={inv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-card rounded-2xl p-5 border border-amber-500/20">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{inv.investorName}</p>
                            <span className="text-xs text-muted-foreground">{inv.investorEmail}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400 font-mono font-bold">{fmt(inv.amount)}</span></span>
                            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{inv.businessName}</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Bank Transfer</span>
                          </div>
                          {inv.note && <p className="text-xs text-muted-foreground mt-1 italic">"{inv.note}"</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {inv.screenshotBase64 && (
                            <button onClick={() => setPreviewImg(inv.screenshotBase64!)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-obsidian-800 hover:bg-obsidian-700 border border-border transition-all">
                              <Eye className="w-3.5 h-3.5" /> Screenshot
                            </button>
                          )}
                          <button
                            onClick={() => handleConfirm(inv)}
                            disabled={confirming === inv.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 text-xs font-bold transition-all disabled:opacity-50"
                          >
                            {confirming === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Confirm Receipt
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmed investments */}
            {confirmed.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Confirmed ({confirmed.length})
                </h2>
                <div className="space-y-3">
                  {confirmed.map((inv, i) => (
                    <motion.div key={inv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-card rounded-2xl p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{inv.investorName}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span className="text-emerald-400 font-mono font-bold">{fmt(inv.amount)}</span>
                            <span>{inv.businessName}</span>
                            <span className={cn('px-1.5 py-0.5 rounded-full border text-[10px]',
                              inv.paymentMethod === 'WALLET' ? 'bg-brand-500/10 text-brand-400 border-brand-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')}>
                              {inv.paymentMethod === 'WALLET' ? 'Wallet' : 'Bank Transfer'}
                            </span>
                          </div>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {investments.length === 0 && (
              <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-brand-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">No investments yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Investors who invest in your businesses will appear here</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Screenshot preview modal */}
      {previewImg && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImg(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewImg(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-obsidian-900 border border-border rounded-full flex items-center justify-center hover:bg-obsidian-800 transition-colors z-10">
              <X className="w-4 h-4" />
            </button>
            <img src={previewImg} alt="Payment screenshot" className="w-full rounded-2xl border border-border" />
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
