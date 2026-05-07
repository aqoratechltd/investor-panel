'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDownToLine, CheckCircle, XCircle, DollarSign, Clock, AlertCircle, Filter, X, Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MetricCard } from '@/components/ui/metric-card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import toast from 'react-hot-toast'

type FilterStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED'

interface Withdrawal {
  id: string
  investorId: string
  investorName: string
  amount: number
  method: string
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED'
  accountDetails: string
  requestedAt: string
  processedAt?: string
  notes?: string
}

const METHOD_BADGE: Record<string, string> = {
  BANK:      'bg-blue-500/10 text-blue-400',
  EASYPAISA: 'bg-emerald-500/10 text-emerald-400',
  JAZZCASH:  'bg-red-500/10 text-red-400',
  STRIPE:    'bg-violet-500/10 text-violet-400',
}

function RejectModal({ withdrawal, onConfirm, onClose }: { withdrawal: Withdrawal; onConfirm: (notes: string) => void; onClose: () => void }) {
  const [notes, setNotes] = useState('')
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm gradient-border p-6 rounded-2xl" style={{ background: 'hsl(222 44% 8%)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold">Reject Withdrawal</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Rejecting <span className="text-foreground font-medium">{formatCurrency(withdrawal.amount)}</span> for <span className="text-foreground font-medium">{withdrawal.investorName}</span></p>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for rejection (optional)..."
          className="w-full h-24 px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-brand-500 mb-4" />
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" className="flex-1" onClick={() => { onConfirm(notes); onClose() }}>Reject</Button>
        </div>
      </motion.div>
    </div>
  )
}

export default function SellerWithdrawalsPage() {
  const { user } = useAuthStore()
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState<FilterStatus>('ALL')
  const [rejectTarget, setRejectTarget] = useState<Withdrawal | null>(null)

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore')

        // Query withdrawals where sellerId matches this seller
        const snap = await getDocs(query(
          collection(db, 'withdrawals'),
          where('sellerId', '==', user.id),
          orderBy('requestedAt', 'desc'),
        ))

        const list: Withdrawal[] = snap.docs.map(d => {
          const data = d.data()
          return {
            id: d.id,
            investorId: data.investorId || '',
            investorName: data.investorName || 'Investor',
            amount: data.amount || 0,
            method: data.method || 'BANK',
            status: data.status || 'PENDING',
            accountDetails: data.accountDetails || '',
            requestedAt: data.requestedAt?.toDate?.()?.toISOString?.() ?? data.requestedAt ?? new Date().toISOString(),
            processedAt: data.processedAt?.toDate?.()?.toISOString?.() ?? data.processedAt,
            notes: data.notes,
          }
        })
        setWithdrawals(list)
      } catch (e) {
        console.error('[SellerWithdrawals] load error:', e)
      }
      setLoading(false)
    }
    load()
  }, [user?.id])

  const handleApprove = async (id: string, investorName: string) => {
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc } = await import('firebase/firestore')
      await updateDoc(doc(db, 'withdrawals', id), { status: 'APPROVED' })
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'APPROVED' as const } : w))
      toast.success(`Approved for ${investorName}`)
    } catch (e: any) { toast.error(e?.message || 'Failed to approve') }
  }

  const handleReject = async (id: string, notes: string, investorId: string, amount: number) => {
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc, setDoc, increment } = await import('firebase/firestore')
      await updateDoc(doc(db, 'withdrawals', id), { status: 'REJECTED', notes: notes || null })
      // Refund available balance to investor
      await setDoc(doc(db, 'user_flags', investorId), { availableBalance: increment(amount) }, { merge: true })
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'REJECTED' as const, notes } : w))
      toast.success('Withdrawal rejected')
    } catch (e: any) { toast.error(e?.message || 'Failed to reject') }
  }

  const handleComplete = async (id: string) => {
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
      await updateDoc(doc(db, 'withdrawals', id), { status: 'COMPLETED', processedAt: serverTimestamp() })
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'COMPLETED' as const, processedAt: new Date().toISOString() } : w))
      toast.success('Marked as completed')
    } catch (e: any) { toast.error(e?.message || 'Failed to complete') }
  }

  const filtered      = filter === 'ALL' ? withdrawals : withdrawals.filter(w => w.status === filter)
  const pendingCount  = withdrawals.filter(w => w.status === 'PENDING').length
  const pendingAmount = withdrawals.filter(w => w.status === 'PENDING').reduce((s, w) => s + w.amount, 0)
  const completedAmount = withdrawals.filter(w => w.status === 'COMPLETED').reduce((s, w) => s + w.amount, 0)

  const FILTERS: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Rejected', value: 'REJECTED' },
  ]

  const COLS: Column[] = [
    {
      key: 'investorName', label: 'Investor', sortable: true,
      render: (v) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center text-xs font-bold text-brand-400">
            {String(v).split(' ').map((n: string) => n[0]).join('')}
          </div>
          <span className="text-sm font-medium">{v}</span>
        </div>
      ),
    },
    { key: 'amount',         label: 'Amount',    sortable: true, render: (v) => <span className="font-mono font-semibold">{formatCurrency(v)}</span> },
    { key: 'method',         label: 'Method',    render: (v) => <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', METHOD_BADGE[v] || 'bg-obsidian-800 text-muted-foreground')}>{v.replace('_', ' ')}</span> },
    { key: 'accountDetails', label: 'Account',   render: (v) => <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px] block">{v}</span> },
    { key: 'status',         label: 'Status',    render: (v) => <StatusBadge status={v} /> },
    { key: 'requestedAt',    label: 'Requested', render: (v) => <span className="text-xs text-muted-foreground">{formatDate(v)}</span> },
    {
      key: 'id', label: 'Actions', align: 'right',
      render: (_, row) => (
        <div className="flex gap-1.5 justify-end">
          {row.status === 'PENDING' && (
            <>
              <Button size="sm" variant="profit" className="h-7 text-xs gap-1" onClick={() => handleApprove(row.id, row.investorName)}>
                <CheckCircle className="w-3 h-3" /> Approve
              </Button>
              <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => setRejectTarget(row)}>
                <XCircle className="w-3 h-3" /> Reject
              </Button>
            </>
          )}
          {row.status === 'APPROVED' && (
            <Button size="sm" variant="glass" className="h-7 text-xs gap-1 text-emerald-400" onClick={() => handleComplete(row.id)}>
              <CheckCircle className="w-3 h-3" /> Complete
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout role="SELLER" title="Withdrawal Requests" subtitle="Review and approve investor withdrawal requests">
      {pendingCount > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            <span className="font-semibold">{pendingCount} withdrawal request{pendingCount !== 1 ? 's' : ''}</span> awaiting your approval — totalling{' '}
            <span className="font-semibold">{formatCurrency(pendingAmount)}</span>
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Pending"        value={pendingCount}    format="number"   icon={Clock}          iconColor="text-amber-400"   iconBg="bg-amber-500/10"   index={0} />
        <MetricCard title="Pending Amount" value={pendingAmount}   format="currency" icon={DollarSign}     iconColor="text-red-400"     iconBg="bg-red-500/10"     index={1} />
        <MetricCard title="Completed"      value={completedAmount} format="currency" icon={CheckCircle}    iconColor="text-emerald-400" iconBg="bg-emerald-500/10" index={2} />
        <MetricCard title="Total Requests" value={withdrawals.length} format="number" icon={ArrowDownToLine} iconColor="text-brand-400" iconBg="bg-brand-500/10" index={3} />
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all', filter === f.value ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent')}>
            {f.label}
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full', filter === f.value ? 'bg-brand-500/30' : 'bg-muted/40')}>
              {withdrawals.filter(w => f.value === 'ALL' || w.status === f.value).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
        </div>
      ) : (
        <DataTable columns={COLS} data={filtered} rowKey={(r) => r.id} emptyMessage="No withdrawal requests found" />
      )}

      <AnimatePresence>
        {rejectTarget && (
          <RejectModal
            withdrawal={rejectTarget}
            onConfirm={(notes) => { handleReject(rejectTarget.id, notes, rejectTarget.investorId, rejectTarget.amount); setRejectTarget(null) }}
            onClose={() => setRejectTarget(null)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
