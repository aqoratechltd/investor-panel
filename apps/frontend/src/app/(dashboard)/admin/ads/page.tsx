'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone, Plus, Eye, Edit2, Trash2, TrendingUp,
  MousePointer, BarChart3, Play, Pause, Image as ImageIcon, X,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MetricCard } from '@/components/ui/metric-card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { formatDate, cn } from '@/lib/utils'
import { useAdminStore, type Ad } from '@/stores/admin.store'
import toast from 'react-hot-toast'

const TYPE_COLORS: Record<string, string> = {
  BANNER: 'bg-blue-500/10 text-blue-400',
  MODAL: 'bg-violet-500/10 text-violet-400',
  NOTIFICATION: 'bg-amber-500/10 text-amber-400',
  SIDEBAR: 'bg-emerald-500/10 text-emerald-400',
}

function CreateAdModal({ onClose, onCreate }: { onClose: () => void; onCreate: (ad: Omit<Ad, 'id' | 'impressions' | 'clicks' | 'createdAt'>) => void }) {
  const [form, setForm] = useState({
    title: '',
    type: 'BANNER' as Ad['type'],
    placement: 'INVESTOR_DASHBOARD' as Ad['placement'],
    targetRole: 'INVESTOR' as Ad['targetRole'],
    imageUrl: '',
    link: '',
    status: 'ACTIVE' as Ad['status'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  })

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error('Ad title is required'); return }
    onCreate(form)
    onClose()
    toast.success(`Ad "${form.title}" created`)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md gradient-border p-6 rounded-2xl" style={{ background: 'hsl(222 44% 8%)' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-lg">Create New Ad</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Ad Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Upgrade to Enterprise" className="w-full bg-obsidian-900 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Ad['type'] }))} className="w-full bg-obsidian-900 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                <option>BANNER</option><option>MODAL</option><option>NOTIFICATION</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Target Role</label>
              <select value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value as Ad['targetRole'] }))} className="w-full bg-obsidian-900 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                <option>INVESTOR</option><option>SELLER</option><option>ALL</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Placement</label>
            <select value={form.placement} onChange={e => setForm(f => ({ ...f, placement: e.target.value as Ad['placement'] }))} className="w-full bg-obsidian-900 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none">
              <option>INVESTOR_DASHBOARD</option><option>SELLER_DASHBOARD</option><option>ALL</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Link URL</label>
            <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="/marketplace" className="w-full bg-obsidian-900 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full bg-obsidian-900 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="w-full bg-obsidian-900 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="brand" className="flex-1" onClick={handleSubmit}>Create Ad</Button>
        </div>
      </motion.div>
    </div>
  )
}

export default function AdminAdsPage() {
  const { ads, createAd, toggleAdStatus, deleteAd } = useAdminStore()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0)
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0)
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const activeAds = ads.filter(a => a.status === 'ACTIVE').length

  const COLS: Column[] = [
    {
      key: 'title', label: 'Ad Title', sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-obsidian-800 flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">{v}</p>
            <p className="text-xs text-muted-foreground">{row.placement.replace('_', ' ')}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type', label: 'Type',
      render: (v) => <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', TYPE_COLORS[v] || 'bg-muted text-muted-foreground')}>{v.toLowerCase()}</span>,
    },
    { key: 'targetRole', label: 'Target', render: (v) => <span className="text-xs text-muted-foreground capitalize">{v.toLowerCase()}</span> },
    { key: 'impressions', label: 'Impressions', sortable: true, render: (v) => <span className="font-mono text-sm">{v.toLocaleString()}</span> },
    { key: 'clicks', label: 'Clicks', sortable: true, render: (v) => <span className="font-mono text-sm">{v.toLocaleString()}</span> },
    {
      key: 'impressions', label: 'CTR', sortable: false,
      render: (_, row) => {
        const ctr = row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0
        return <span className={cn('font-mono text-sm font-medium', ctr > 5 ? 'text-emerald-400' : ctr > 3 ? 'text-amber-400' : 'text-muted-foreground')}>{ctr.toFixed(2)}%</span>
      },
    },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'id', label: '', align: 'right',
      render: (_, row) => (
        <div className="flex gap-1.5 justify-end">
          {row.status === 'ACTIVE' && (
            <Button size="icon-sm" variant="ghost" className="h-7 w-7 text-amber-400" onClick={() => { toggleAdStatus(row.id); toast.success('Ad paused') }}>
              <Pause className="w-3.5 h-3.5" />
            </Button>
          )}
          {row.status === 'PAUSED' && (
            <Button size="icon-sm" variant="ghost" className="h-7 w-7 text-emerald-400" onClick={() => { toggleAdStatus(row.id); toast.success('Ad activated') }}>
              <Play className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button size="icon-sm" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300" onClick={() => { deleteAd(row.id); toast.success('Ad deleted') }}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout role="SUPER_ADMIN" title="Ad Network" subtitle="Create and manage platform advertisements">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Active Ads" value={activeAds} format="number" icon={Megaphone} change={2} iconColor="text-brand-400" iconBg="bg-brand-500/10" index={0} />
        <MetricCard title="Total Impressions" value={totalImpressions} format="number" icon={Eye} change={14.2} iconColor="text-violet-400" iconBg="bg-violet-500/10" index={1} />
        <MetricCard title="Total Clicks" value={totalClicks} format="number" icon={MousePointer} change={9.8} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" index={2} />
        <MetricCard title="Avg. CTR" value={parseFloat(avgCTR.toFixed(2))} format="number" icon={BarChart3} change={1.2} changeLabel="%" iconColor="text-amber-400" iconBg="bg-amber-500/10" index={3} />
      </div>

      {/* Active Ad Performance Cards */}
      {ads.filter(a => a.status === 'ACTIVE').length > 0 && (
        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          {ads.filter(a => a.status === 'ACTIVE').map((ad, i) => {
            const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0
            return (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="gradient-border p-5 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full -translate-y-8 translate-x-8" />
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', TYPE_COLORS[ad.type] || 'bg-muted text-muted-foreground')}>{ad.type.toLowerCase()}</span>
                    <h4 className="font-medium text-sm mt-2">{ad.title}</h4>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Impressions</p>
                    <p className="text-sm font-mono font-bold">{ad.impressions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Clicks</p>
                    <p className="text-sm font-mono font-bold">{ad.clicks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CTR</p>
                    <p className={cn('text-sm font-mono font-bold', ctr > 5 ? 'text-emerald-400' : 'text-amber-400')}>{ctr.toFixed(2)}%</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold">All Advertisements</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{ads.length} total ads created</p>
        </div>
        <Button variant="brand" size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Create Ad
        </Button>
      </div>
      <DataTable columns={COLS} data={ads} rowKey={(r) => r.id} />

      <AnimatePresence>
        {showCreateModal && (
          <CreateAdModal onClose={() => setShowCreateModal(false)} onCreate={createAd} />
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
