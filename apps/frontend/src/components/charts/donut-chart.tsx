'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface DonutChartProps {
  data: Array<{ name: string; value: number; color?: string }>
  colors?: string[]
  height?: number
  innerRadius?: number
  outerRadius?: number
  format?: 'currency' | 'number' | 'percent'
  showLegend?: boolean
  centerLabel?: string
  centerValue?: string
}

const DEFAULT_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function CustomTooltip({ active, payload }: TooltipProps<any, any>) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="chart-tooltip">
      <p className="text-xs text-muted-foreground mb-1">{item.name}</p>
      <p className="text-sm font-bold font-mono" style={{ color: item.payload.color }}>
        {formatCurrency(item.value)}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatPercent(item.payload.percent * 100)}
      </p>
    </div>
  )
}

export function DonutChart({
  data,
  colors = DEFAULT_COLORS,
  height = 200,
  innerRadius = 55,
  outerRadius = 80,
  format = 'currency',
  showLegend = true,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const dataWithPercent = data.map(d => ({ ...d, percent: total > 0 ? d.value / total : 0 }))

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0" style={{ width: outerRadius * 2 + 20, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataWithPercent}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {dataWithPercent.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center content */}
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {centerValue && (
              <p className="text-lg font-bold font-mono text-foreground">{centerValue}</p>
            )}
            {centerLabel && (
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                {centerLabel}
              </p>
            )}
          </div>
        )}
      </div>

      {showLegend && (
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          {dataWithPercent.map((item, i) => (
            <div key={i} className="flex items-center gap-2 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: item.color || colors[i % colors.length] }}
              />
              <span className="text-xs text-muted-foreground truncate flex-1">{item.name}</span>
              <span className="text-xs font-mono font-medium flex-shrink-0">
                {formatPercent(item.percent * 100, 1)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
