'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard, Plus, TrendingUp, Users, DollarSign,
  CheckCircle, Edit2, Trash2, Star, Zap, Crown, X,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MetricCard } from '@/components/ui/metric-card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { BarChart } from '@/components/charts/bar-chart'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAdminStore, type Subscription } from '@/stores/admin.store'
import toast from 'react-hot-toast'

const PLANS = [
  {
    id: '1', name: 'Starter', price: 49, interval: 'month', maxInvestors: 25,
    features: ['25 investors', 'Basic analytics', 'Email support', 'CSV export'],
    color: 'from-slate-500 to-slate-600', icon: Star, badge: null,
  },
  {
    id: '2', name: 'Growth', price: 149, interval: 'month', maxInvestors: 100,
    features: ['100 investors', 'Advanced analytics', 'Priority support', 'PDF/CSV export', 'Custom coins'],
    color: 'from-brand-500 to-brand-600', icon: Zap, badge: 'Most Popular',
  },
  {
    id: '3', name: 'Enterprise', price: 399, interval: 'month', maxInvestors: -1,
    features: ['Unlimited investors', 'AI insights', 'Dedicated support', 'All export formats', 'Custom branding', 'API access'],
    color: 'from-violet-500 to-violet-600', icon: Crown, badge: 'Best Value',
  },
]

const MRR_DATA = [
  { name: 'Oct', value: 18200 },
  { name: 'Nov', value: 22400 },
  { name: 'Dec', value: 27800 },
  { name: 'Jan', value: 31200 },
  { name: 'Feb', value: 34900 },
  { name: 'Mar', value: 38500 },
]

function ChangePlanModal({ sub, onClose, onUpdate }: { sub: Subscription; onClose: () => void; onUpdate: (id: string, plan: Subscription['plan']) => void }) {
  const [plan, setPlan] = useState<Subscription['plan']>(sub.plan)
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm gradient-border p-6 rounded-2xl" style={{ background: 'hsl(222 44% 8%)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold">Change Plan</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Updating plan for <span className="text-foreground font-medium">{sub.sellerName}</span></p>
        <div className="space-y-2 mb-6">
          {(['STARTER', 'GROWTH', 'ENTERPRISE'] as const).map(p => (
            <button key={p} onClick={() => setPlan(p)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${plan === p ? 'border-brand-500/50 bg-brand-500/10 text-brand-400' : 'border-border hover:border-border/80 text-muted-foreground'}`}>
              <span className="font-medium capitalize">{p.toLowerCase()}</span>
              <span className="text-sm font-mono">${p === 'STARTER' ? 49 : p === 'GROWTH' ? 149 : 399}/mo</span>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="brand" className="flex-1" onClick={() => { onUpdate(sub.id, plan); onClose(); toast.success(`Plan updated to ${plan}`) }}>Update Plan</Button>
        </div>
      </motion.div>
    </div>
  )
}

export default function AdminSubscriptionsPage() {
  const { subscriptions, cancelSubscription, updatePlan, initialize, isLoaded } = useAdminStore()
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'billing'>('overview')

  useEffect(() => { if (!isLoaded) initialize() }, [isLoaded, initialize])
  const [editSub, setEditSub] = useState<Subscription | null>(null)

  const totalMRR = subscriptions.filter(s => s.status === 'ACTIVE').reduce((sum, s) => sum + s.amount, 0)
  const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE').length

  // Plan distribution counts from subscriptions
  const planCounts = {
    Starter: subscriptions.filter(s => s.plan === 'STARTER').length,
    Growth: subscriptions.filter(s => s.plan === 'GROWTH').length,
    Enterprise: subscriptions.filter(s => s.plan === 'ENTERPRISE').length,
  }

  const COLS: Column[] = [
    { key: 'sellerName', label: 'Seller', sortable: true },
    { key: 'plan', label: 'Plan', render: (v) => <span className="badge-info capitalize text-xs">{v.toLowerCase()}</span> },
    { key: 'billingCycle', label: 'Cycle', render: (v) => <span className="text-xs text-muted-foreground capitalize">{v.toLowerCase()}</span> },
    { key: 'amount', label: 'MRR', sortable: true, render: (v) => <span className="font-mono font-medium">{formatCurrency(v)}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'nextBillingDate', label: 'Next Billing', render: (v) => v ? <span className="text-xs text-muted-foreground">{formatDate(v)}</span> : <span className="text-xs text-muted-foreground">—</span> },
    {
      key: 'id', label: '', align: 'right',
      render: (_, row) => (
        <div className="flex gap-1.5 justify-end">
          <Button size="icon-sm" variant="ghost" className="h-7 w-7" onClick={() => setEditSub(row)}><Edit2 className="w-3.5 h-3.5" /></Button>
          {row.status !== 'CANCELLED' && (
            <Button size="icon-sm" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300" onClick={() => { cancelSubscription(row.id); toast.success('Subscription cancelled') }}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout role="SUPER_ADMIN" title="Subscriptions" subtitle="Manage subscription plans and billing">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Monthly Revenue" value={totalMRR} format="currency" icon={DollarSign} change={10.4} iconColor="text-brand-400" iconBg="bg-brand-500/10" index={0} />
        <MetricCard title="Active Subs" value={activeSubs} format="number" icon={CreditCard} change={5.2} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" index={1} />
        <MetricCard title="Churned (30d)" value={subscriptions.filter(s => s.status === 'CANCELLED').length} format="number" icon={TrendingUp} change={-2.1} iconColor="text-red-400" iconBg="bg-red-500/10" index={2} />
        <MetricCard title="Total Sellers" value={subscriptions.length} format="number" icon={Users} change={3.8} iconColor="text-violet-400" iconBg="bg-violet-500/10" index={3} />
      </div>

      <div className="flex gap-1 p-1 bg-obsidian-900/60 rounded-xl w-fit mb-8 border border-border">
        {(['overview', 'plans', 'billing'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-obsidian-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
              <h3 className="font-display font-bold mb-1">MRR Growth</h3>
              <p className="text-xs text-muted-foreground mb-6">Monthly recurring revenue trend</p>
              <BarChart data={MRR_DATA} height={200} color="#06b6d4" />
            </div>
            <div className="gradient-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
              <h3 className="font-display font-bold mb-6">Plan Distribution</h3>
              <div className="space-y-4">
                {PLANS.map(plan => {
                  const count = planCounts[plan.name as keyof typeof planCounts] || 0
                  const total = Object.values(planCounts).reduce((a, b) => a + b, 0)
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0
                  return (
                    <div key={plan.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium">{plan.name}</span>
                        <span className="text-sm font-mono text-muted-foreground">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-obsidian-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                          className={`h-full rounded-full bg-gradient-to-r ${plan.color}`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <DataTable columns={COLS} data={subscriptions} rowKey={(r) => r.id} />
        </div>
      )}

      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold">Subscription Plans</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Configure pricing and features</p>
            </div>
            <Button variant="brand" size="sm"><Plus className="w-4 h-4 mr-1.5" />New Plan</Button>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="gradient-border p-6 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}
              >
                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">{plan.badge}</span>
                  </div>
                )}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                  <plan.icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-display font-bold text-lg">{plan.name}</h4>
                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-3xl font-display font-bold font-mono">${plan.price}</span>
                  <span className="text-muted-foreground text-sm">/{plan.interval}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.maxInvestors === -1 ? 'Unlimited investors' : `Up to ${plan.maxInvestors} investors`}
                </p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-sm font-mono font-medium">{planCounts[plan.name as keyof typeof planCounts] || 0} active</span>
                  <div className="flex gap-1.5">
                    <Button size="icon-sm" variant="ghost" className="h-7 w-7"><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button size="icon-sm" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <DataTable
          columns={[
            ...COLS.slice(0, -1),
            { key: 'startedAt', label: 'Started', render: (v) => <span className="text-xs text-muted-foreground">{formatDate(v)}</span> },
          ]}
          data={subscriptions}
          rowKey={(r) => r.id}
        />
      )}

      {editSub && (
        <ChangePlanModal sub={editSub} onClose={() => setEditSub(null)} onUpdate={updatePlan} />
      )}
    </DashboardLayout>
  )
}
