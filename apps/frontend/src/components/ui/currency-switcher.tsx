'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useCurrencyStore, CURRENCY_META, type Currency } from '@/stores/currency.store'
import { cn } from '@/lib/utils'

const CURRENCIES: Currency[] = ['USD', 'GBP', 'EUR', 'PKR']

export function CurrencySwitcher({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const { currency, setCurrency } = useCurrencyStore()
  const ref = useRef<HTMLDivElement>(null)
  const meta = CURRENCY_META[currency]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted transition-colors',
          compact ? 'h-8 px-2 text-xs' : 'h-9 px-3 text-sm',
        )}
      >
        <span className="text-base leading-none">{meta.flag}</span>
        <span className="font-mono font-semibold text-brand-400">{currency}</span>
        {!compact && <span className="text-xs text-muted-foreground hidden sm:block">{meta.symbol}</span>}
        <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1.5 w-52 bg-obsidian-900 border border-white/10 rounded-xl overflow-hidden z-50"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(6,182,212,0.08)' }}
          >
            <div className="p-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-2 py-1.5">
                Select Currency
              </p>
              {CURRENCIES.map((c) => {
                const m = CURRENCY_META[c]
                const isSelected = c === currency
                return (
                  <button
                    key={c}
                    onClick={() => { setCurrency(c); setOpen(false) }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                      isSelected ? 'bg-brand-500/10 text-brand-400' : 'hover:bg-white/5 text-foreground',
                    )}
                  >
                    <span className="text-lg leading-none">{m.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold font-mono">{c}</p>
                      <p className="text-xs text-muted-foreground">{m.name}</p>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground">{m.symbol}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-400" />}
                  </button>
                )
              })}
            </div>
            {/* Live rates strip */}
            <div className="border-t border-border/50 px-3 py-2 bg-obsidian-950/50">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mb-1">vs USD</p>
              <div className="flex items-center gap-3">
                {(['GBP', 'EUR', 'PKR'] as Currency[]).map((c) => (
                  <span key={c} className="text-[10px] font-mono text-muted-foreground">
                    <span className="text-foreground/80">{c}</span>{' '}
                    {({ GBP: '0.792', EUR: '0.921', PKR: '278.5' } as Record<string, string>)[c]}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
