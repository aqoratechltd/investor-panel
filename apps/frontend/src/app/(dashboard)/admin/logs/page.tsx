'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Search,
  LogIn, LogOut,
  DollarSign, TrendingUp, Shield, AlertTriangle,
  User, Settings as SettingsIcon, Trash2,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { formatDate } from '@/lib/utils'
import { useAdminStore } from '@/stores/admin.store'

const LOG_ICONS: Record<string, any> = {
  AUTH: LogIn, LOGIN: LogIn, LOGOUT: LogOut, WITHDRAWAL: DollarSign, INVESTMENT: TrendingUp,
  ADMIN: Shield, SECURITY: AlertTriangle, USER: User, SETTINGS: SettingsIcon, DELETE: Trash2,
}

const LOG_COLORS: Record<string, string> = {
  AUTH: 'text-emerald-400 bg-emerald-500/10',
  LOGIN: 'text-emerald-400 bg-emerald-500/10',
  LOGOUT: 'text-slate-400 bg-slate-500/10',
  WITHDRAWAL: 'text-amber-400 bg-amber-500/10',
  INVESTMENT: 'text-brand-400 bg-brand-500/10',
  ADMIN: 'text-violet-400 bg-violet-500/10',
  SECURITY: 'text-red-400 bg-red-500/10',
  USER: 'text-blue-400 bg-blue-500/10',
  SETTINGS: 'text-slate-400 bg-slate-500/10',
  DELETE: 'text-red-400 bg-red-500/10',
}

const SEVERITY_STYLES: Record<string, string> = {
  info: 'border-l-2 border-transparent',
  warning: 'border-l-2 border-amber-500/50 bg-amber-500/[0.03]',
  critical: 'border-l-2 border-red-500/50 bg-red-500/5',
}

const SEVERITY_DOT: Record<string, string> = {
  info: 'bg-emerald-400',
  warning: 'bg-amber-400',
  critical: 'bg-red-400',
}

type FilterType = 'ALL' | 'AUTH' | 'WITHDRAWAL' | 'INVESTMENT' | 'ADMIN' | 'SECURITY'

const FILTER_MAP: Record<FilterType, string[]> = {
  ALL: [],
  AUTH: ['AUTH', 'LOGIN', 'LOGOUT'],
  WITHDRAWAL: ['WITHDRAWAL'],
  INVESTMENT: ['INVESTMENT'],
  ADMIN: ['ADMIN', 'SETTINGS', 'DELETE'],
  SECURITY: ['SECURITY'],
}

export default function AdminLogsPage() {
  const { logs, initialize, isLoaded } = useAdminStore()
  const [filter, setFilter] = useState<FilterType>('ALL')

  useEffect(() => { if (!isLoaded) initialize() }, [isLoaded, initialize])
  const [search, setSearch] = useState('')

  const filtered = logs.filter(log => {
    const matchType = filter === 'ALL' || FILTER_MAP[filter].includes(log.type)
    const matchSearch = !search || log.action.toLowerCase().includes(search.toLowerCase()) || log.actor.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  return (
    <DashboardLayout role="SUPER_ADMIN" title="Activity Logs" subtitle="Full audit trail of all platform actions">

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search logs by action or actor..."
            className="w-full bg-obsidian-900 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
          />
        </div>
        <div className="flex gap-1 p-1 bg-obsidian-900/60 rounded-xl border border-border">
          {(['ALL', 'AUTH', 'WITHDRAWAL', 'INVESTMENT', 'ADMIN', 'SECURITY'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filter === f ? 'bg-obsidian-800 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {f.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        {[
          { label: 'Total Events', value: logs.length, color: 'text-muted-foreground bg-obsidian-800' },
          { label: 'Critical', value: logs.filter(l => l.severity === 'critical').length, color: 'text-red-400 bg-red-500/10' },
          { label: 'Warnings', value: logs.filter(l => l.severity === 'warning').length, color: 'text-amber-400 bg-amber-500/10' },
          { label: 'Info', value: logs.filter(l => l.severity === 'info').length, color: 'text-emerald-400 bg-emerald-500/10' },
        ].map(b => (
          <div key={b.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${b.color}`}>
            <span className="font-mono font-bold">{b.value}</span>
            <span className="text-xs">{b.label}</span>
          </div>
        ))}
      </div>

      <div className="gradient-border overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
        <div className="divide-y divide-border">
          {filtered.map((log, i) => {
            const Icon = LOG_ICONS[log.type] || FileText
            const colorClass = LOG_COLORS[log.type] || 'text-slate-400 bg-slate-500/10'
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className={`flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors ${SEVERITY_STYLES[log.severity]}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className="text-sm text-foreground leading-snug">{log.action}</p>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${SEVERITY_DOT[log.severity]}`} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground font-mono">{log.actor}</span>
                    <span className="text-xs text-muted-foreground/60">·</span>
                    <span className="text-xs text-muted-foreground capitalize">{log.role.toLowerCase().replace('_', ' ')}</span>
                    <span className="text-xs text-muted-foreground/60">·</span>
                    <span className="text-xs text-muted-foreground font-mono">{log.ip}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5 font-mono">{formatDate(log.timestamp)}</span>
              </motion.div>
            )
          })}
          {filtered.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No log entries match your filter.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
