'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDownToLine, CheckCircle, XCircle, Eye, DollarSign, Clock, AlertCircle, Filter, X } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MetricCard } from '@/components/ui/metric-card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useAdminStore, type AdminWithdrawal } from '@/stores/admin.store'
import toast from 'react-hot-toast'

type FilterStatus = 'ALL' | 'PENDING' | 'PROCESSING' | 'APPROVED' | 'COMPLETED' | 'REJECTED'

const METHOD_COLORS: Record<string, string> = {
  BANK: 'bg-blue-500/10 text-blue-400',
  EASYPAISA: 'bg-emerald-500/10 text-emerald-400',
  JAZZCASH: 'bg-red-500/10 text-red-400',
  STRIPE: 'bg-violet-500/10 text-violet-400',
}

function RejectModal({ withdrawal, onConfirm, onClose }: { withdrawal: AdminWithdrawal; onConfirm: (notes: string) => void; onClose: () => void }) {
  const [notes, setNotes] = useState('')
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm gradient-border p-6 rounded-2xl" style={{ background: 'hsl(222 44% 8%)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold">Reject Withdrawal</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Rejecting <span className="text-foreground font-medium">{formatCurrency(withdrawal.amount)}</span> for <span className="text-foreground font-medium">{withdrawal.investorName}</span></p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Reason for rejection (optional)..."
          className="w-full h-24 px-3 py-2.5 rounded-xl border border-border bg-muted/20 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-brand-500 mb-4"
        />
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" className="flex-1" onClick={() => { onConfirm(notes); onClose() }}>Reject</Button>
        </div>
      </motion.div>
    </div>
  )
}

export default function AdminWithdrawalsPage() {
  const { withdrawals, approveWithdrawal, rejectWithdrawal, markWithdrawalProcessing, markWithdrawalCompleted } = useAdminStore()
  const [filter, setFilter] = useState<FilterStatus>('ALL')
  const [rejectTarget, setRejectTarget] = useState<AdminWithdrawal | null>(null)

  const filtered = filter === 'ALL' ? withdrawals : withdrawals.filter(w => w.status === filter)
  const pendingCount = withdrawals.filter(w => w.status === 'PENDING').length
  const pendingAmount = withdrawals.filter(w => w.status === 'PENDING').reduce((s, w) => s + w.amount, 0)
  const completedAmount = withdrawals.filter(w => w.status === 'COMPLETED').reduce((s, w) => s + w.amount, 0)

  const COLS: Column[] = [
    { key: 'investorName', label: 'Investor', sortable: true },
    { key: 'sellerName', label: 'Seller', render: (v) => <span className="text-xs text-muted-foreground">{v}</span> },
    { key: 'amount', label: 'Amount', sortable: true, render: (v) => <span className="font-mono font-semibold">{formatCurrency(v)}</span> },
    { key: 'method', label: 'Method', render: (v) => <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', METHOD_COLORS[v] || 'bg-muted text-muted-foreground')}>{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'requestedAt', label: 'Requested', render: (v) => <span className="text-xs text-muted-foreground">{formatDate(v)}</span> },
    {
      key: 'id', label: 'Actions', align: 'right',
      render: (_, row) => (
        <div className="flex gap-1.5 justify-end">
          {row.status === 'PENDING' && (
            <>
              <Button size="sm" variant="profit" className="h-7 text-xs gap-1" onClick={() => { approveWithdrawal(row.id); toast.success(`Withdrawal approved for ${row.investorName}`) }}>
                <CheckCircle className="w-3 h-3" /> Approve
              </Button>
              <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => setRejectTarget(row)}>
                <XCircle className="w-3 h-3" /> Reject
              </Button>
            </>
          )}
          {row.status === 'APPROVED' && (
            <Button size="sm" variant="glass" className="h-7 text-xs gap-1 text-emerald-400" onClick={() => { markWithdrawalCompleted(row.id); toast.success('Marked as completed') }}>
              <CheckCircle className="w-3 h-3" /> Complete
            </Button>
          )}
          {row.status === 'PROCESSING' && (
            <Button size="sm" variant="glass" className="h-7 text-xs gap-1" onClick={() => { approveWithdrawal(row.id); toast.success('Approved') }}>
              <CheckCircle className="w-3 h-3" /> Approve
            </Button>
          )}
        </div>
      ),
    },
  ]

  const FILTERS: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Rejected', value: 'REJECTED' },
  ]

  return (
    <DashboardLayout role="SUPER_ADMIN" title="Withdrawal Monitoring" subtitle="Review and approve investor withdrawal requests">
      {pendingCount > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            <span className="font-semibold">{pendingCount} withdrawal requests</span> are awaiting review — totalling{' '}
            <span className="font-semibold">{formatCurrency(pendingAmount)}</span>
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Pending Requests" value={pendingCount} format="number" icon={Clock} iconColor="text-amber-400" iconBg="bg-amber-500/10" index={0} />
        <MetricCard title="Pending Amount" value={pendingAmount} format="currency" icon={DollarSign} iconColor="text-red-400" iconBg="bg-red-500/10" index={1} />
        <MetricCard title="Completed (30d)" value={completedAmount} format="currency" icon={CheckCircle} change={8.2} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" index={2} />
        <MetricCard title="Total Requests" value={withdrawals.length} format="number" icon={ArrowDownToLine} iconColor="text-brand-400" iconBg="bg-brand-500/10" index={3} />
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all', filter === f.value ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent')}>
            {f.label}
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full', filter === f.value ? 'bg-brand-500/30' : 'bg-muted/40')}>
              {filter === f.value ? filtered.length : withdrawals.filter(w => f.value === 'ALL' || w.status === f.value).length}
            </span>
          </button>
        ))}
      </div>

      <DataTable columns={COLS} data={filtered} rowKey={(r) => r.id} emptyMessage="No withdrawal requests found" />

      <AnimatePresence>
        {rejectTarget && <RejectModal withdrawal={rejectTarget} onConfirm={(notes) => { rejectWithdrawal(rejectTarget.id, notes); toast.success('Withdrawal rejected') }} onClose={() => setRejectTarget(null)} />}
      </AnimatePresence>
    </DashboardLayout>
  )
}
