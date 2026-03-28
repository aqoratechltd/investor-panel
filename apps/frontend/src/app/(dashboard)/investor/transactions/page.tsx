'use client'

import { useState } from 'react'
import { ArrowDownToLine, ArrowUpRight, Search, DollarSign, TrendingUp, Coins, Activity } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MetricCard } from '@/components/ui/metric-card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useInvestorStore } from '@/stores/investor.store'

type TxType = 'ALL' | 'INVESTMENT' | 'PROFIT' | 'WITHDRAWAL' | 'COIN_EARN' | 'COIN_SPEND' | 'DEPOSIT'

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  INVESTMENT: { label: 'Investment', icon: TrendingUp, color: 'text-brand-400', bg: 'bg-brand-500/10' },
  PROFIT: { label: 'Profit', icon: ArrowUpRight, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  WITHDRAWAL: { label: 'Withdrawal', icon: ArrowDownToLine, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  COIN_EARN: { label: 'Coin Earned', icon: Coins, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  COIN_SPEND: { label: 'Coin Spent', icon: Coins, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  DEPOSIT: { label: 'Deposit', icon: DollarSign, color: 'text-violet-400', bg: 'bg-violet-500/10' },
}

export default function InvestorTransactionsPage() {
  const { transactions } = useInvestorStore()
  const [typeFilter, setTypeFilter] = useState<TxType>('ALL')
  const [search, setSearch] = useState('')

  const filtered = transactions.filter(tx => {
    const matchType = typeFilter === 'ALL' || tx.type === typeFilter
    const matchSearch = !search || tx.description.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const totalProfit = transactions.filter(t => t.type === 'PROFIT').reduce((s, t) => s + t.amount, 0)
  const totalWithdrawn = Math.abs(transactions.filter(t => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0))
  const totalInvested = Math.abs(transactions.filter(t => t.type === 'INVESTMENT').reduce((s, t) => s + t.amount, 0))

  const COLS: Column[] = [
    {
      key: 'type', label: 'Type',
      render: (v, row) => {
        const cfg = TYPE_CONFIG[v] ?? { label: v, icon: Activity, color: 'text-muted-foreground', bg: 'bg-muted/20' }
        return (
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
              <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium">{row.description}</p>
              <p className="text-xs text-muted-foreground">{cfg.label}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'amount', label: 'Amount', sortable: true, align: 'right',
      render: (v, row) => {
        if (row.coinAmount) return <span className="font-mono font-semibold text-sm text-amber-400">+{row.coinAmount} ◈</span>
        return (
          <span className={cn('font-mono font-semibold text-sm', v > 0 ? 'text-emerald-400' : 'text-foreground')}>
            {v > 0 ? '+' : ''}{formatCurrency(Math.abs(v))}
          </span>
        )
      },
    },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'date', label: 'Date', render: (v) => <span className="text-xs text-muted-foreground font-mono">{formatDate(v)}</span> },
    { key: 'reference', label: 'Ref', render: (v) => v ? <span className="text-xs font-mono text-muted-foreground">{v}</span> : null },
  ]

  return (
    <DashboardLayout role="INVESTOR" title="Transactions" subtitle="Complete history of all your financial activity">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Total Invested" value={totalInvested} format="currency" icon={TrendingUp} iconColor="text-brand-400" iconBg="bg-brand-500/10" index={0} />
        <MetricCard title="Total Profit" value={totalProfit} format="currency" icon={ArrowUpRight} change={14.6} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" index={1} />
        <MetricCard title="Total Withdrawn" value={totalWithdrawn} format="currency" icon={ArrowDownToLine} iconColor="text-amber-400" iconBg="bg-amber-500/10" index={2} />
        <MetricCard title="Transactions" value={transactions.length} format="number" icon={Activity} iconColor="text-violet-400" iconBg="bg-violet-500/10" index={3} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..."
            className="w-full bg-obsidian-900 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all" />
        </div>
        <div className="flex gap-1 p-1 bg-obsidian-900/60 rounded-xl border border-border overflow-x-auto">
          {(['ALL', 'INVESTMENT', 'PROFIT', 'WITHDRAWAL', 'COIN_EARN', 'DEPOSIT'] as TxType[]).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap capitalize ${typeFilter === t ? 'bg-obsidian-800 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.replace('_', ' ').toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <DataTable columns={COLS} data={filtered} rowKey={(r) => r.id} emptyMessage="No transactions found" />
    </DashboardLayout>
  )
}
