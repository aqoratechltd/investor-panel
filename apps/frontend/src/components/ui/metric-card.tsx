'use client'

import { motion } from 'framer-motion'
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn, formatNumber, formatPercent } from '@/lib/utils'
import { useCurrencyStore } from '@/stores/currency.store'

interface MetricCardProps {
  title: string
  value: number | string
  format?: 'currency' | 'number' | 'percent' | 'raw'
  change?: number
  changeLabel?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  description?: string
  compact?: boolean
  index?: number
  className?: string
}

export function MetricCard({
  title,
  value,
  format = 'raw',
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-brand-400',
  iconBg = 'bg-brand-500/10',
  description,
  compact = false,
  index = 0,
  className,
}: MetricCardProps) {
  const { format: formatCurr } = useCurrencyStore()
  const formattedValue = (() => {
    if (typeof value === 'string') return value
    if (format === 'currency') return formatCurr(value as number, true)
    if (format === 'number') return formatNumber(value as number, true)
    if (format === 'percent') return formatPercent(value as number)
    return String(value)
  })()

  const isPositive = change !== undefined && change >= 0
  const isNegative = change !== undefined && change < 0
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={cn('metric-card', className)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('p-2.5 rounded-xl', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        {change !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border',
            isPositive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            isNegative ? 'bg-red-500/10 text-red-400 border-red-500/20' :
            'bg-muted text-muted-foreground border-border',
          )}>
            <TrendIcon className="w-3 h-3" />
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <motion.p
          key={formattedValue}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'font-display font-bold tracking-tight',
            compact ? 'text-2xl' : 'text-3xl',
          )}
        >
          {formattedValue}
        </motion.p>
        {(description || changeLabel) && (
          <p className="text-xs text-muted-foreground">
            {changeLabel || description}
          </p>
        )}
      </div>
    </motion.div>
  )
}
