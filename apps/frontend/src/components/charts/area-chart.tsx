'use client'

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface AreaChartProps {
  data: Array<{ date: string; value: number; [key: string]: any }>
  dataKey?: string
  color?: string
  gradientId?: string
  format?: 'currency' | 'number'
  height?: number
  showGrid?: boolean
  showTooltip?: boolean
  className?: string
}

function CustomTooltip({ active, payload, label, format }: TooltipProps<any, any> & { format?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold font-mono text-brand-400">
        {format === 'currency'
          ? formatCurrency(payload[0].value)
          : formatNumber(payload[0].value)}
      </p>
    </div>
  )
}

export function AreaChart({
  data,
  dataKey = 'value',
  color = '#06b6d4',
  gradientId = 'areaGradient',
  format = 'currency',
  height = 200,
  showGrid = true,
  showTooltip = true,
  className,
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height} className={className}>
      <RechartsAreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        )}

        <XAxis
          dataKey="date"
          tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => {
            try {
              return new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            } catch { return v }
          }}
        />

        <YAxis
          tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => format === 'currency' ? `$${formatNumber(v, true)}` : formatNumber(v, true)}
          width={60}
        />

        {showTooltip && (
          <Tooltip
            content={<CustomTooltip format={format} />}
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
          />
        )}

        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: 'hsl(222 44% 8%)', strokeWidth: 2 }}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}
