'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type AreaData,
  ColorType,
  CrosshairMode,
  LineStyle,
} from 'lightweight-charts'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, BarChart2, CandlestickChart, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCurrencyStore } from '@/stores/currency.store'

// ── Types ───────────────────────────────────────────────────────

export interface OHLCBar {
  time: string   // 'YYYY-MM-DD' or unix timestamp
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

type ChartType = 'candlestick' | 'area' | 'bars'
type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'

interface TradingChartProps {
  data: OHLCBar[]
  symbol?: string
  name?: string
  height?: number
  showVolume?: boolean
  showTimeframes?: boolean
  showTypeToggle?: boolean
  className?: string
  onCrosshairMove?: (price: number | null) => void
}

// ── Generate synthetic OHLC from close prices ─────────────────

export function generateOHLC(
  basePrice: number,
  days: number,
  volatility = 0.03,
  trend = 0.001,
): OHLCBar[] {
  const bars: OHLCBar[] = []
  let price = basePrice

  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const open = price
    const change = (Math.random() - 0.48) * volatility + trend
    const close = open * (1 + change)
    const wickUp = Math.random() * volatility * 0.5
    const wickDown = Math.random() * volatility * 0.5
    const high = Math.max(open, close) * (1 + wickUp)
    const low = Math.min(open, close) * (1 - wickDown)
    const volume = Math.floor(50000 + Math.random() * 200000)

    bars.push({
      time: dateStr,
      open: parseFloat(open.toFixed(4)),
      high: parseFloat(high.toFixed(4)),
      low: parseFloat(low.toFixed(4)),
      close: parseFloat(close.toFixed(4)),
      volume,
    })
    price = close
  }

  return bars
}

// ── Filter by timeframe ────────────────────────────────────────

function filterByTimeframe(data: OHLCBar[], tf: Timeframe): OHLCBar[] {
  const now = new Date()
  const cutoff = new Date()
  if (tf === '1D') cutoff.setDate(now.getDate() - 1)
  else if (tf === '1W') cutoff.setDate(now.getDate() - 7)
  else if (tf === '1M') cutoff.setMonth(now.getMonth() - 1)
  else if (tf === '3M') cutoff.setMonth(now.getMonth() - 3)
  else if (tf === '1Y') cutoff.setFullYear(now.getFullYear() - 1)
  else return data

  const cutoffStr = cutoff.toISOString().split('T')[0]
  return data.filter((d) => d.time >= cutoffStr)
}

// ── Main Component ─────────────────────────────────────────────

export function TradingChart({
  data,
  symbol = 'ASSET',
  name,
  height = 320,
  showVolume = true,
  showTimeframes = true,
  showTypeToggle = true,
  className,
  onCrosshairMove,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<any> | null>(null)
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  const [chartType, setChartType] = useState<ChartType>('candlestick')
  const [timeframe, setTimeframe] = useState<Timeframe>('3M')
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null)
  const [hoveredChange, setHoveredChange] = useState<number | null>(null)

  const { format } = useCurrencyStore()

  const filteredData = filterByTimeframe(data, timeframe)
  const lastBar = filteredData[filteredData.length - 1]
  const firstBar = filteredData[0]
  const priceChange = lastBar && firstBar ? lastBar.close - firstBar.open : 0
  const pctChange = firstBar ? (priceChange / firstBar.open) * 100 : 0
  const isPositive = priceChange >= 0

  const buildChart = useCallback(() => {
    if (!containerRef.current) return
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
      seriesRef.current = null
      volumeRef.current = null
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: showVolume ? height - 60 : height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#7a8fa6',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)', style: LineStyle.Dashed },
        horzLines: { color: 'rgba(255,255,255,0.04)', style: LineStyle.Dashed },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(6,182,212,0.5)', style: LineStyle.Dashed, width: 1, labelBackgroundColor: '#0e7490' },
        horzLine: { color: 'rgba(6,182,212,0.5)', style: LineStyle.Dashed, width: 1, labelBackgroundColor: '#0e7490' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        textColor: '#7a8fa6',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: any) => {
          const d = new Date(time * 1000)
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    })

    chartRef.current = chart

    if (chartType === 'candlestick') {
      const cs = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      })
      cs.setData(filteredData as CandlestickData[])
      seriesRef.current = cs
    } else if (chartType === 'area') {
      const areaColor = isPositive ? '#10b981' : '#ef4444'
      const as = chart.addAreaSeries({
        topColor: `${areaColor}33`,
        bottomColor: `${areaColor}00`,
        lineColor: areaColor,
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: areaColor,
        crosshairMarkerBackgroundColor: areaColor,
      })
      const areaData: AreaData[] = filteredData.map((d) => ({ time: d.time as any, value: d.close }))
      as.setData(areaData)
      seriesRef.current = as
    } else {
      const bs = chart.addBarSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
      })
      bs.setData(filteredData as CandlestickData[])
      seriesRef.current = bs
    }

    // Volume histogram
    if (showVolume && filteredData.some((d) => d.volume)) {
      const vs = chart.addHistogramSeries({
        color: 'rgba(6,182,212,0.2)',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      })
      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
      vs.setData(
        filteredData.map((d) => ({
          time: d.time as any,
          value: d.volume || 0,
          color: d.close >= d.open ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)',
        })),
      )
      volumeRef.current = vs
    }

    // Crosshair
    chart.subscribeCrosshairMove((param) => {
      if (param.seriesData.size && seriesRef.current) {
        const point = param.seriesData.get(seriesRef.current) as any
        const price = point?.close ?? point?.value ?? null
        setHoveredPrice(price)
        setHoveredChange(price && firstBar ? ((price - firstBar.open) / firstBar.open) * 100 : null)
        onCrosshairMove?.(price)
      } else {
        setHoveredPrice(null)
        setHoveredChange(null)
        onCrosshairMove?.(null)
      }
    })

    chart.timeScale().fitContent()

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth })
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [filteredData, chartType, showVolume, height, isPositive, firstBar, onCrosshairMove])

  useEffect(() => {
    const cleanup = buildChart()
    return () => {
      cleanup?.()
      chartRef.current?.remove()
      chartRef.current = null
    }
  }, [buildChart])

  const displayPrice = hoveredPrice ?? lastBar?.close ?? 0
  const displayChange = hoveredChange ?? pctChange
  const displayIsPositive = displayChange >= 0

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">{symbol}</span>
            {name && <span className="text-xs text-muted-foreground">· {name}</span>}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-mono font-bold">{format(displayPrice)}</span>
            <span className={cn(
              'flex items-center gap-1 text-sm font-mono font-medium px-2 py-0.5 rounded-full',
              displayIsPositive
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-red-400 bg-red-500/10',
            )}>
              {displayIsPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {displayChange >= 0 ? '+' : ''}{displayChange.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Chart Type Toggle */}
          {showTypeToggle && (
            <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border">
              {([
                { type: 'candlestick' as ChartType, icon: CandlestickChart },
                { type: 'area' as ChartType, icon: Activity },
                { type: 'bars' as ChartType, icon: BarChart2 },
              ] as const).map(({ type, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={cn(
                    'p-1.5 rounded-md transition-all',
                    chartType === type
                      ? 'bg-brand-500/20 text-brand-400'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          )}

          {/* Timeframe */}
          {showTimeframes && (
            <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border">
              {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={cn(
                    'px-2 py-1 text-xs font-mono rounded-md transition-all',
                    timeframe === tf
                      ? 'bg-brand-500/20 text-brand-400 font-bold'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* OHLC Bar (on hover) */}
      {hoveredPrice !== null && lastBar && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-2 text-xs font-mono text-muted-foreground"
        >
          {(['O', 'H', 'L', 'C'] as const).map((label, i) => {
            const val = [lastBar.open, lastBar.high, lastBar.low, lastBar.close][i]
            return (
              <span key={label}>
                <span className="text-muted-foreground/60 mr-1">{label}</span>
                <span className={cn(
                  label === 'C' ? (isPositive ? 'text-emerald-400' : 'text-red-400') : 'text-foreground',
                )}>
                  {format(val)}
                </span>
              </span>
            )
          })}
        </motion.div>
      )}

      {/* Chart */}
      <div ref={containerRef} className="w-full" style={{ minHeight: showVolume ? height - 60 : height }} />
    </div>
  )
}
