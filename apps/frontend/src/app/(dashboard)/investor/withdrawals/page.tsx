'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet, Plus, Clock, DollarSign, CheckCircle,
  AlertCircle, CreditCard, Smartphone, Building, X, Loader2,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MetricCard } from '@/components/ui/metric-card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import toast from 'react-hot-toast'

interface Withdrawal {
  id: string
  amount: number
  method: string
  accountDetails: string
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED'
  requestedAt: string
  processedAt?: string
  notes?: string
}

const METHODS = [
  { id: 'BANK'      as const, label: 'Bank Transfer',  icon: Building,    desc: '2-3 business days',    color: 'text-blue-400' },
  { id: 'EASYPAISA' as const, label: 'EasyPaisa',      icon: Smartphone,  desc: 'Instant to 2 hours',   color: 'text-green-400' },
  { id: 'JAZZCASH'  as const, label: 'JazzCash',       icon: Smartphone,  desc: 'Instant to 2 hours',   color: 'text-red-400' },
  { id: 'STRIPE'    as const, label: 'Stripe / Card',  icon: CreditCard,  desc: '1-2 business days',    color: 'text-violet-400' },
]

export default function InvestorWithdrawalsPage() {
  const { user } = useAuthStore()
  const [withdrawals, setWithdrawals]         = useState<Withdrawal[]>([])
  const [availableBalance, setAvailableBalance] = useState(0)
  const [loading, setLoading]                 = useState(true)
  const [submitting, setSubmitting]           = useState(false)
  const [showForm, setShowForm]               = useState(false)
  const [selectedMethod, setSelectedMethod]   = useState<'BANK' | 'EASYPAISA' | 'JAZZCASH' | 'STRIPE'>('BANK')
  const [amount, setAmount]                   = useState('')
  const [accountDetails, setAccountDetails]   = useState('')

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, query, where, orderBy, getDocs, getDoc, doc } = await import('firebase/firestore')

        const [wdSnap, flagSnap] = await Promise.all([
          getDocs(query(
            collection(db, 'withdrawals'),
            where('investorId', '==', user.id),
            orderBy('requestedAt', 'desc'),
          )),
          getDoc(doc(db, 'user_flags', user.id)),
        ])

        const list: Withdrawal[] = wdSnap.docs.map(d => {
          const data = d.data()
          return {
            id: d.id,
            amount: data.amount || 0,
            method: data.method || 'BANK',
            accountDetails: data.accountDetails || '',
            status: data.status || 'PENDING',
            requestedAt: data.requestedAt?.toDate?.()?.toISOString?.() ?? data.requestedAt ?? new Date().toISOString(),
            processedAt:  data.processedAt?.toDate?.()?.toISOString?.() ?? data.processedAt,
            notes: data.notes,
          }
        })

        setWithdrawals(list)
        const flagData = flagSnap.exists() ? flagSnap.data() : {}
        setAvailableBalance(flagData?.availableBalance ?? 0)
      } catch (e) {
        console.error('[Withdrawals] load error:', e)
      }
      setLoading(false)
    }
    load()
  }, [user?.id])

  const handleSubmit = async () => {
    if (!user?.id) return
    const amt = parseFloat(amount)
    if (!amt || amt <= 0)          { toast.error('Enter a valid amount'); return }
    if (amt > availableBalance)    { toast.error('Insufficient balance'); return }
    if (!accountDetails.trim())    { toast.error('Enter account details'); return }

    setSubmitting(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, addDoc, doc, setDoc, increment, serverTimestamp, getDocs, query: q2, where, orderBy, limit } = await import('firebase/firestore')

      // Look up sellerId from most recent investment so seller can see this withdrawal
      let sellerId: string | null = null
      let sellerName: string | null = null
      try {
        const invSnap = await getDocs(q2(
          collection(db, 'investments'),
          where('investorId', '==', user.id),
          orderBy('createdAt', 'desc'),
          limit(1),
        ))
        if (!invSnap.empty) {
          const inv = invSnap.docs[0].data()
          sellerId  = inv.sellerId  ?? null
          sellerName = inv.sellerName ?? null
        }
      } catch {}

      const ref = await addDoc(collection(db, 'withdrawals'), {
        investorId: user.id,
        investorName: `${user.firstName} ${user.lastName}`,
        sellerId,
        sellerName,
        amount: amt,
        method: selectedMethod,
        accountDetails: accountDetails.trim(),
        status: 'PENDING',
        requestedAt: serverTimestamp(),
        processedAt: null,
        notes: null,
      })

      // Deduct from available balance
      await setDoc(doc(db, 'user_flags', user.id), {
        availableBalance: increment(-amt),
        userId: user.id,
      }, { merge: true })

      // Log as transaction
      await addDoc(collection(db, 'transactions'), {
        investorId: user.id,
        type: 'WITHDRAWAL',
        description: `Withdrawal via ${selectedMethod} — $${amt.toLocaleString()}`,
        amount: -amt,
        status: 'PENDING',
        reference: `WD-${ref.id.slice(0, 8).toUpperCase()}`,
        createdAt: serverTimestamp(),
      })

      const newWithdrawal: Withdrawal = {
        id: ref.id,
        amount: amt,
        method: selectedMethod,
        accountDetails: accountDetails.trim(),
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
      }

      setWithdrawals(prev => [newWithdrawal, ...prev])
      setAvailableBalance(prev => Math.max(0, prev - amt))
      toast.success('Withdrawal request submitted!')
      setShowForm(false)
      setAmount('')
      setAccountDetails('')
    } catch (e: any) {
      toast.error(e?.message || 'Submission failed')
    }
    setSubmitting(false)
  }

  const handleCancel = async (id: string) => {
    const w = withdrawals.find(w => w.id === id)
    if (!w || w.status !== 'PENDING') return
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc, setDoc, increment } = await import('firebase/firestore')
      await updateDoc(doc(db, 'withdrawals', id), { status: 'REJECTED' })
      await setDoc(doc(db, 'user_flags', user!.id), {
        availableBalance: increment(w.amount),
      }, { merge: true })
      setWithdrawals(prev => prev.map(x => x.id === id ? { ...x, status: 'REJECTED' as const } : x))
      setAvailableBalance(prev => prev + w.amount)
      toast.success('Request cancelled')
    } catch (e: any) {
      toast.error(e?.message || 'Cancellation failed')
    }
  }

  const pending        = withdrawals.filter(w => w.status === 'PENDING')
  const completed      = withdrawals.filter(w => w.status === 'COMPLETED')
  const totalWithdrawn = completed.reduce((s, w) => s + w.amount, 0)

  const COLS: Column[] = [
    { key: 'amount',         label: 'Amount',    render: (v) => <span className="font-mono font-semibold">{formatCurrency(v)}</span> },
    { key: 'method',         label: 'Method',    render: (v) => <span className="text-xs text-muted-foreground">{v.replace('_', ' ')}</span> },
    { key: 'accountDetails', label: 'Account',   render: (v) => <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px] block">{v}</span> },
    { key: 'status',         label: 'Status',    render: (v) => <StatusBadge status={v} /> },
    { key: 'requestedAt',    label: 'Requested', render: (v) => <span className="text-xs text-muted-foreground">{formatDate(v)}</span> },
    { key: 'processedAt',    label: 'Processed', render: (v) => v ? <span className="text-xs text-muted-foreground">{formatDate(v)}</span> : <span className="text-xs text-muted-foreground">—</span> },
    {
      key: 'id', label: '', align: 'right',
      render: (_, row) => row.status === 'PENDING' ? (
        <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400" onClick={() => handleCancel(row.id)}>Cancel</Button>
      ) : null,
    },
  ]

  return (
    <DashboardLayout role="INVESTOR" title="Withdrawals" subtitle="Request and track your withdrawals">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Available Balance" value={availableBalance}                                    format="currency" icon={Wallet}       iconColor="text-brand-400"   iconBg="bg-brand-500/10"   index={0} />
        <MetricCard title="Pending"           value={pending.reduce((s, w) => s + w.amount, 0)}          format="currency" icon={Clock}         iconColor="text-amber-400"   iconBg="bg-amber-500/10"   index={1} />
        <MetricCard title="Total Withdrawn"   value={totalWithdrawn}                                      format="currency" icon={CheckCircle}   iconColor="text-emerald-400" iconBg="bg-emerald-500/10" index={2} />
        <MetricCard title="Requests"          value={withdrawals.length}                                  format="number"   icon={DollarSign}    iconColor="text-violet-400"  iconBg="bg-violet-500/10"  index={3} />
      </div>

      {!showForm ? (
        <div className="gradient-border p-6 mb-8 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <div>
            <h3 className="font-display font-bold">Request Withdrawal</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Available balance: <span className="text-foreground font-semibold font-mono">{formatCurrency(availableBalance)}</span></p>
          </div>
          <Button variant="brand" size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1.5" /> New Request</Button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="gradient-border p-6 mb-8" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold">New Withdrawal Request</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium block mb-1.5">Withdrawal Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0.00"
                className="w-full bg-obsidian-900 border border-border rounded-xl pl-8 pr-4 py-3 text-lg font-mono font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all" />
            </div>
            <div className="flex gap-2 mt-2">
              {[1000, 5000, 10000, Math.floor(availableBalance * 0.5)].filter(v => v > 0 && v <= availableBalance).map(v => (
                <button key={v} onClick={() => setAmount(String(v))}
                  className="text-xs px-2.5 py-1 rounded-lg bg-obsidian-800 text-muted-foreground hover:text-foreground hover:bg-obsidian-700 transition-all">
                  {formatCurrency(v, 'USD', true)}
                </button>
              ))}
              <button onClick={() => setAmount(String(availableBalance))}
                className="text-xs px-2.5 py-1 rounded-lg bg-obsidian-800 text-muted-foreground hover:text-foreground hover:bg-obsidian-700 transition-all">
                Max
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium block mb-3">Payment Method</label>
            <div className="grid sm:grid-cols-2 gap-3">
              {METHODS.map(method => (
                <button key={method.id} onClick={() => setSelectedMethod(method.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${selectedMethod === method.id ? 'border-brand-500/50 bg-brand-500/5' : 'border-border hover:border-border/80 hover:bg-white/[0.02]'}`}>
                  <div className="w-9 h-9 rounded-lg bg-obsidian-800 flex items-center justify-center flex-shrink-0">
                    <method.icon className={`w-4 h-4 ${method.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{method.label}</p>
                    <p className="text-xs text-muted-foreground">{method.desc}</p>
                  </div>
                  {selectedMethod === method.id && (
                    <div className="ml-auto w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-obsidian-950" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium block mb-1.5">Account Details</label>
            <input value={accountDetails} onChange={e => setAccountDetails(e.target.value)}
              placeholder="IBAN / Phone number / Account ID..."
              className="w-full bg-obsidian-900 border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-brand-500/50 transition-all" />
          </div>

          <div className="mb-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">
              Withdrawals are reviewed by your seller within 1-2 business days. Once approved, funds are processed via your selected payment method.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="glass" size="sm" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</Button>
            <Button variant="brand" size="sm" onClick={handleSubmit}
              disabled={!amount || parseFloat(amount) <= 0 || submitting}>
              {submitting ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Submitting…</> : 'Submit Request'}
            </Button>
          </div>
        </motion.div>
      )}

      <div>
        <h3 className="font-display font-bold mb-5">Withdrawal History</h3>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
          </div>
        ) : (
          <DataTable columns={COLS} data={withdrawals} rowKey={(r) => r.id} emptyMessage="No withdrawal requests yet" />
        )}
      </div>
    </DashboardLayout>
  )
}
