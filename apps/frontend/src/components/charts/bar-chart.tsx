'use client'

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface BarChartProps {
  data: Array<{ name: string; value: number; color?: string; [key: string]: any }>
  dataKey?: string
  color?: string
  format?: 'currency' | 'number'
  height?: number
  showGrid?: boolean
  colorBars?: boolean
}

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444']

export function BarChart({
  data,
  dataKey = 'value',
  color = '#06b6d4',
  format = 'currency',
  height = 200,
  showGrid = true,
  colorBars = false,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap="30%">
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        )}
        <XAxis
          dataKey="name"
          tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => format === 'currency' ? `$${formatNumber(v, true)}` : formatNumber(v, true)}
          width={56}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            return (
              <div className="chart-tooltip">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className="text-sm font-bold font-mono text-brand-400">
                  {format === 'currency' ? formatCurrency(payload[0].value as number) : formatNumber(payload[0].value as number)}
                </p>
              </div>
            )
          }}
        />
        <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} maxBarSize={48}>
          {colorBars
            ? data.map((entry, i) => (
                <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
              ))
            : data.map((_, i) => (
                <Cell key={i} fill={color} fillOpacity={0.8 + (i === data.length - 1 ? 0.2 : 0)} />
              ))
          }
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
