'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Eye, Trash2, Search, X, RefreshCw } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DataTable, type Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, formatNumber, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface SellerRow {
  id: string
  companyName: string
  owner: string
  email: string
  phone: string
  plan: string
  createdAt: string
  investors: number
  totalInvested: number
  isApproved: boolean
  isSuspended: boolean
}

type FilterStatus = 'ALL' | 'APPROVED' | 'PENDING' | 'SUSPENDED'

// ── Seller Detail Modal ──────────────────────────────────────────────────────
function SellerModal({ seller, onClose }: { seller: SellerRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg gradient-border p-8 rounded-2xl" style={{ background: 'hsl(222 44% 8%)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold">Seller Details</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Company', value: seller.companyName },
              { label: 'Owner', value: seller.owner },
              { label: 'Email', value: seller.email },
              { label: 'Phone', value: seller.phone || '—' },
              { label: 'Plan', value: seller.plan },
              { label: 'Joined', value: formatDate(seller.createdAt) },
              { label: 'Investors', value: formatNumber(seller.investors) },
              { label: 'Total Invested', value: formatCurrency(seller.totalInvested, 'USD', true) },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-xl bg-white/[0.03] border border-white/8">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/8">
            <p className="text-sm text-muted-foreground">Status</p>
            {seller.isSuspended ? <StatusBadge status="SUSPENDED" /> : seller.isApproved ? <StatusBadge status="ACTIVE" /> : <StatusBadge status="PENDING" />}
          </div>
          <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, onConfirm, onClose, variant = 'danger' }: { title: string; message: string; onConfirm: () => void; onClose: () => void; variant?: 'danger' | 'warning' }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm gradient-border p-6 rounded-2xl" style={{ background: 'hsl(222 44% 8%)' }}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${variant === 'danger' ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
          <AlertTriangle className={`w-6 h-6 ${variant === 'danger' ? 'text-red-400' : 'text-amber-400'}`} />
        </div>
        <h3 className="font-display font-bold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant={variant === 'danger' ? 'destructive' : 'default'} className="flex-1" onClick={() => { onConfirm(); onClose() }}>Confirm</Button>
        </div>
      </motion.div>
    </div>
  )
}

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<SellerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('ALL')
  const [search, setSearch] = useState('')
  const [viewSeller, setViewSeller] = useState<SellerRow | null>(null)
  const [confirm, setConfirm] = useState<{ action: () => void; title: string; message: string; variant?: 'danger' | 'warning' } | null>(null)

  const loadSellers = async () => {
    setLoading(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, query, where, getDocs } = await import('firebase/firestore')

      // Get all SELLER users
      const usersQ = query(collection(db, 'users'), where('role', '==', 'SELLER'))
      const usersSnap = await getDocs(usersQ)

      // Get all approved investments aggregated by sellerId
      const invQ = query(collection(db, 'investments'), where('status', '==', 'APPROVED'))
      const invSnap = await getDocs(invQ)

      // Build aggregation map
      const invMap: Record<string, { count: number; total: number }> = {}
      invSnap.docs.forEach(d => {
        const inv = d.data()
        const sid = inv.sellerId || inv.businessSellerId
        if (!sid) return
        if (!invMap[sid]) invMap[sid] = { count: 0, total: 0 }
        invMap[sid].count += 1
        invMap[sid].total += inv.amount || 0
      })

      // Map to SellerRow
      const rows: SellerRow[] = usersSnap.docs.map(d => {
        const u = d.data()
        const agg = invMap[d.id] || { count: 0, total: 0 }
        return {
          id: d.id,
          companyName: u.companyName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          owner: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          email: u.email || '',
          phone: u.phone || '',
          plan: u.plan || 'FREE',
          createdAt: u.createdAt || u.joinedAt || new Date().toISOString(),
          investors: agg.count,
          totalInvested: agg.total,
          isApproved: u.isApproved !== false && u.status !== 'PENDING',
          isSuspended: u.status === 'SUSPENDED' || u.isSuspended === true,
        }
      })

      setSellers(rows)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load sellers')
    }
    setLoading(false)
  }

  useEffect(() => { loadSellers() }, [])

  const updateSellerStatus = async (id: string, updates: Record<string, unknown>) => {
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc } = await import('firebase/firestore')
      await updateDoc(doc(db, 'users', id), updates)
      setSellers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
    } catch (e) {
      console.error(e)
      toast.error('Action failed')
    }
  }

  const handleApprove = async (row: SellerRow) => {
    await updateSellerStatus(row.id, { isApproved: true, status: 'ACTIVE' })
    setSellers(prev => prev.map(s => s.id === row.id ? { ...s, isApproved: true, isSuspended: false } : s))
    toast.success(`${row.companyName} approved!`)
  }

  const handleSuspend = async (row: SellerRow) => {
    await updateSellerStatus(row.id, { isSuspended: true, status: 'SUSPENDED' })
    setSellers(prev => prev.map(s => s.id === row.id ? { ...s, isSuspended: true } : s))
    toast.success(`${row.companyName} suspended`)
  }

  const handleUnsuspend = async (row: SellerRow) => {
    await updateSellerStatus(row.id, { isSuspended: false, status: 'ACTIVE' })
    setSellers(prev => prev.map(s => s.id === row.id ? { ...s, isSuspended: false } : s))
    toast.success(`${row.companyName} unsuspended`)
  }

  const handleDelete = async (row: SellerRow) => {
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, deleteDoc } = await import('firebase/firestore')
      await deleteDoc(doc(db, 'users', row.id))
      setSellers(prev => prev.filter(s => s.id !== row.id))
      toast.success(`${row.companyName} deleted`)
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete seller')
    }
  }

  const filtered = sellers.filter(s => {
    const matchSearch = s.companyName.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (filter === 'APPROVED') return s.isApproved && !s.isSuspended
    if (filter === 'PENDING') return !s.isApproved && !s.isSuspended
    if (filter === 'SUSPENDED') return s.isSuspended
    return true
  })

  const tabs: { label: string; value: FilterStatus; count: number }[] = [
    { label: 'All', value: 'ALL', count: sellers.length },
    { label: 'Active', value: 'APPROVED', count: sellers.filter(s => s.isApproved && !s.isSuspended).length },
    { label: 'Pending', value: 'PENDING', count: sellers.filter(s => !s.isApproved && !s.isSuspended).length },
    { label: 'Suspended', value: 'SUSPENDED', count: sellers.filter(s => s.isSuspended).length },
  ]

  const COLUMNS: Column[] = [
    { key: 'companyName', label: 'Company', sortable: true },
    { key: 'email', label: 'Email', render: (v) => <span className="text-muted-foreground text-sm">{v}</span> },
    { key: 'plan', label: 'Plan', render: (v) => <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium border', v === 'ENTERPRISE' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : v === 'GROWTH' ? 'bg-brand-500/10 text-brand-400 border-brand-500/20' : 'bg-muted/40 text-muted-foreground border-border')}>{v}</span> },
    { key: 'investors', label: 'Investors', sortable: true, render: (v) => <span className="font-mono">{formatNumber(v)}</span> },
    { key: 'totalInvested', label: 'Total Invested', sortable: true, render: (v) => <span className="font-mono text-brand-400">{formatCurrency(v, 'USD', true)}</span> },
    { key: 'status', label: 'Status', render: (_, row) => row.isSuspended ? <StatusBadge status="SUSPENDED" /> : row.isApproved ? <StatusBadge status="ACTIVE" /> : <StatusBadge status="PENDING" /> },
    { key: 'createdAt', label: 'Joined', render: (v) => <span className="text-xs text-muted-foreground">{formatDate(v)}</span> },
    {
      key: 'actions', label: 'Actions', align: 'right',
      render: (_, row) => (
        <div className="flex items-center gap-1.5 justify-end">
          {!row.isApproved && !row.isSuspended && (
            <Button size="icon-sm" variant="profit" title="Approve" onClick={() => {
              setConfirm({ title: 'Approve Seller', message: `Approve "${row.companyName}"? They will gain full platform access.`, variant: 'warning', action: () => handleApprove(row) })
            }}>
              <CheckCircle className="w-3.5 h-3.5" />
            </Button>
          )}
          {row.isApproved && !row.isSuspended && (
            <Button size="icon-sm" variant="glass" title="Suspend" className="text-amber-400 border-amber-500/20" onClick={() => {
              setConfirm({ title: 'Suspend Seller', message: `Suspend "${row.companyName}"? Their investors will lose access.`, variant: 'warning', action: () => handleSuspend(row) })
            }}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </Button>
          )}
          {row.isSuspended && (
            <Button size="icon-sm" variant="glass" title="Unsuspend" className="text-emerald-400 border-emerald-500/20" onClick={() => handleUnsuspend(row)}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button size="icon-sm" variant="ghost" title="View" onClick={() => setViewSeller(row)}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon-sm" variant="destructive" title="Delete" onClick={() => {
            setConfirm({ title: 'Delete Seller', message: `Permanently delete "${row.companyName}"? This cannot be undone.`, variant: 'danger', action: () => handleDelete(row) })
          }}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout role="SUPER_ADMIN" title="Seller Management" subtitle="Approve, manage and monitor all platform sellers">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl border border-border">
            {tabs.map((f) => (
              <button key={f.value} onClick={() => setFilter(f.value)} className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200', filter === f.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                {f.label}
                <span className={cn('text-xs px-1.5 py-0.5 rounded-full', filter === f.value ? 'bg-brand-500/20 text-brand-400' : 'bg-muted text-muted-foreground')}>{f.count}</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search sellers..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 h-10 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
          <Button variant="glass" onClick={loadSellers} className="gap-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <DataTable columns={COLUMNS} data={filtered} rowKey={(r) => r.id} emptyMessage="No sellers found" />
        )}
      </div>

      <AnimatePresence>
        {viewSeller && <SellerModal seller={viewSeller} onClose={() => setViewSeller(null)} />}
        {confirm && <ConfirmModal {...confirm} onConfirm={confirm.action} onClose={() => setConfirm(null)} />}
      </AnimatePresence>
    </DashboardLayout>
  )
}
