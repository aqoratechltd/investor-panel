'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, X, Save, ToggleLeft, ToggleRight } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, formatNumber, getPnLColor } from '@/lib/utils'
import { useSellerStore, type SellerCoin } from '@/stores/seller.store'
import toast from 'react-hot-toast'

function CoinModal({ coin, onClose, onSave }: { coin?: SellerCoin; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    name: coin?.name ?? '', symbol: coin?.symbol ?? '', description: coin?.description ?? '',
    returnRate: coin?.returnRate?.toString() ?? '', isPositive: coin?.isPositive ?? true, icon: coin?.icon ?? '🎯',
  })
  const ICONS = ['🎯', '🎵', '📈', '⚡', '💎', '🚀', '🌟', '💰']

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Coin name is required'); return }
    if (!form.symbol.trim()) { toast.error('Symbol is required'); return }
    if (!form.returnRate || isNaN(Number(form.returnRate))) { toast.error('Enter a valid return rate'); return }
    onSave({ ...form, returnRate: parseFloat(form.returnRate) })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg gradient-border p-8 rounded-2xl" style={{ background: 'hsl(222 44% 8%)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold">{coin ? 'Edit Coin' : 'Create Coin'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map(icon => (
                <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                  className={cn('w-10 h-10 rounded-xl text-xl border transition-all', form.icon === icon ? 'border-brand-500 bg-brand-500/20' : 'border-border bg-muted/20 hover:border-border/80')}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Coin Name</label>
              <Input placeholder="MetaCoin" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Symbol</label>
              <Input placeholder="META" value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))} className="font-mono" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Description</label>
            <Input placeholder="Represents Meta Ads channel returns..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Return Rate (%)</label>
              <Input type="number" placeholder="5.0" value={form.returnRate} onChange={e => setForm(f => ({ ...f, returnRate: e.target.value }))} className="font-mono" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Direction</label>
              <div className="flex gap-2">
                {[
                  { label: 'Profit', value: true, icon: TrendingUp, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
                  { label: 'Loss', value: false, icon: TrendingDown, color: 'text-red-400 border-red-500/30 bg-red-500/10' },
                ].map(opt => (
                  <button key={String(opt.value)} onClick={() => setForm(f => ({ ...f, isPositive: opt.value }))}
                    className={cn('flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl border text-sm font-medium transition-all', form.isPositive === opt.value ? opt.color : 'border-border bg-muted/20 text-muted-foreground')}>
                    <opt.icon className="w-4 h-4" />{opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {form.name && form.returnRate && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Formula Preview</p>
              <p className="text-sm font-mono text-brand-400">{form.name} = {form.isPositive ? '+' : '-'}{form.returnRate}% monthly return</p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 gap-2" onClick={handleSave}><Save className="w-4 h-4" />{coin ? 'Save Changes' : 'Create Coin'}</Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function SellerCoinsPage() {
  const { coins, createCoin, updateCoin, deleteCoin, toggleCoinActive } = useSellerStore()
  const [showCreate, setShowCreate] = useState(false)
  const [editCoin, setEditCoin] = useState<SellerCoin | null>(null)

  return (
    <DashboardLayout role="SELLER" title="Coin Management" subtitle="Create and manage custom investment tokens">
      <div className="flex items-center justify-between mb-8">
        <div />
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" />Create Coin</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {coins.map((coin, i) => (
          <motion.div key={coin.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={cn('gradient-border p-6 group hover:shadow-glow transition-all duration-300', !coin.isActive && 'opacity-50')}
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
            <div className="flex items-start justify-between mb-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl">{coin.icon}</div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon-sm" variant="ghost" onClick={() => { toggleCoinActive(coin.id); toast.success(coin.isActive ? 'Coin deactivated' : 'Coin activated') }} className={coin.isActive ? 'text-emerald-400' : 'text-muted-foreground'}>
                  {coin.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={() => setEditCoin(coin)}><Edit className="w-3.5 h-3.5" /></Button>
                <Button size="icon-sm" variant="destructive" onClick={() => { deleteCoin(coin.id); toast.success(`${coin.name} deleted`) }}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
            <h3 className="font-display font-bold text-base mb-0.5">{coin.name}</h3>
            <p className="text-xs text-muted-foreground font-mono mb-4">{coin.symbol}</p>
            <p className="text-xs text-muted-foreground mb-5 line-clamp-2">{coin.description}</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Return Rate</span>
                <span className={cn('text-sm font-mono font-semibold flex items-center gap-1', getPnLColor(coin.isPositive ? 1 : -1))}>
                  {coin.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {coin.isPositive ? '+' : '-'}{coin.returnRate}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total Supply</span>
                <span className="text-sm font-mono">{formatNumber(coin.totalSupply)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Current Price</span>
                <span className="text-sm font-mono text-brand-400">${coin.currentPrice}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', coin.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400')}>{coin.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Formula</p>
              <p className="text-xs font-mono text-brand-400">{coin.symbol}_value = invested × (1 {coin.isPositive ? '+' : '-'} {coin.returnRate}%)</p>
            </div>
          </motion.div>
        ))}

        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: coins.length * 0.08 }}
          onClick={() => setShowCreate(true)}
          className="gradient-border p-6 border-dashed flex flex-col items-center justify-center gap-3 hover:bg-white/5 transition-colors min-h-[280px] group"
          style={{ background: 'transparent' }}>
          <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-brand-500/30 flex items-center justify-center group-hover:border-brand-500/60 transition-colors">
            <Plus className="w-6 h-6 text-brand-400/50 group-hover:text-brand-400 transition-colors" />
          </div>
          <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors font-medium">Create new coin</p>
        </motion.button>
      </div>

      <AnimatePresence>
        {showCreate && <CoinModal onClose={() => setShowCreate(false)} onSave={(data) => { createCoin(data); toast.success(`${data.name} created!`) }} />}
        {editCoin && <CoinModal coin={editCoin} onClose={() => setEditCoin(null)} onSave={(data) => { updateCoin(editCoin.id, data); toast.success('Coin updated') }} />}
      </AnimatePresence>
    </DashboardLayout>
  )
}
