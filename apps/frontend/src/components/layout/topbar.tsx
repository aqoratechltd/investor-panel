'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Search, Settings, ChevronDown,
  TrendingUp, TrendingDown, Check, X,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationsStore } from '@/stores/notifications.store'
import { CurrencySwitcher } from '@/components/ui/currency-switcher'

interface TopbarProps {
  title?: string
  subtitle?: string
}

// Ticker data mock
const TICKER_DATA = [
  { symbol: 'META', value: '+5.24%', positive: true },
  { symbol: 'TIKTOK', value: '-1.2%', positive: false },
  { symbol: 'GROWTH', value: '+8.1%', positive: true },
  { symbol: 'GOOGLE', value: '+2.3%', positive: true },
  { symbol: 'WHATSAPP', value: '+3.7%', positive: true },
]

export function Topbar({ title, subtitle }: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { user } = useAuthStore()
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationsStore()
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
      {/* Ticker Tape */}
      <div className="border-b border-border/50 bg-obsidian-950/50 h-7 overflow-hidden">
        <div className="ticker-wrapper h-full">
          <div className="ticker-content flex items-center h-full gap-8 px-4">
            {[...TICKER_DATA, ...TICKER_DATA].map((item, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs flex-shrink-0">
                <span className="text-muted-foreground font-mono">{item.symbol}</span>
                <span className={cn('font-mono font-medium', item.positive ? 'text-emerald-400' : 'text-red-400')}>
                  {item.positive ? <TrendingUp className="inline w-3 h-3 mr-0.5" /> : <TrendingDown className="inline w-3 h-3 mr-0.5" />}
                  {item.value}
                </span>
                <span className="text-border">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main topbar */}
      <div className="flex items-center justify-between h-14 px-6 lg:px-8">
        {/* Left: Title */}
        <div className="min-w-0">
          {title && (
            <div>
              <h1 className="text-base font-display font-bold truncate">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground hidden sm:block">{subtitle}</p>}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Currency */}
          <CurrencySwitcher compact />
          {/* Search */}
          <AnimatePresence>
            {searchOpen ? (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 200, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <input
                  autoFocus
                  type="text"
                  placeholder="Search..."
                  className="w-full h-9 px-3 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                  onBlur={() => setSearchOpen(false)}
                />
              </motion.div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="h-9 w-9 rounded-lg border border-border bg-muted/30 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Search className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </AnimatePresence>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="h-9 w-9 rounded-lg border border-border bg-muted/30 flex items-center justify-center hover:bg-muted transition-colors relative"
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-brand-500 text-obsidian-950 text-[10px] font-bold rounded-full flex items-center justify-center px-1"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-obsidian-900 border border-white/10 rounded-2xl overflow-hidden z-50" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(6,182,212,0.08)' }}
                >
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No notifications
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => !n.isRead && markRead(n.id)}
                          className={cn(
                            'flex gap-3 p-4 border-b border-border/50 cursor-pointer hover:bg-white/5 transition-colors',
                            !n.isRead && 'bg-brand-500/5',
                          )}
                        >
                          <div className={cn(
                            'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                            n.isRead ? 'bg-muted' :
                            n.type === 'SUCCESS' ? 'bg-emerald-400' :
                            n.type === 'ERROR'   ? 'bg-red-400' :
                            'bg-brand-400',
                          )} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">{formatDate(n.createdAt, 'relative')}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User */}
          <Link href={`/${user?.role?.toLowerCase()?.replace('_', '-')}/settings`}>
            <div className="flex items-center gap-2.5 h-9 px-3 rounded-lg border border-border bg-muted/30 hover:bg-muted transition-colors cursor-pointer">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-[11px] font-bold text-obsidian-950 flex-shrink-0">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <span className="text-sm font-medium hidden sm:block max-w-[120px] truncate">
                {user?.firstName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}
