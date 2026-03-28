'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, TrendingUp, Coins, ArrowDownToLine,
  Settings, LogOut, ChevronLeft, ChevronRight, ShieldCheck,
  Megaphone, CreditCard, BarChart3, MessageSquare, Calendar,
  CheckSquare, Bell, Menu, X, Wallet, Award, FileText,
  BrainCircuit, UserCheck, Store, CandlestickChart, Building2, Inbox,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationsStore } from '@/stores/notifications.store'

type NavItem = {
  label: string
  icon: any
  href: string
  badge?: string | number
  section?: string
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Overview',          icon: LayoutDashboard, href: '/admin',                      section: 'Main' },
  { label: 'Seller Applications', icon: UserCheck,     href: '/admin/seller-applications',  section: 'Approve' },
  { label: 'Withdrawals',       icon: ArrowDownToLine, href: '/admin/withdrawals',           section: 'Approve' },
  { label: 'Platform Requests', icon: BrainCircuit,    href: '/admin/platform-requests',     section: 'Approve' },
  { label: 'Sellers',           icon: Users,           href: '/admin/sellers',               section: 'Monitor' },
  { label: 'Businesses',        icon: Building2,       href: '/admin/businesses',            section: 'Monitor' },
  { label: 'Investments',       icon: TrendingUp,      href: '/admin/investments',           section: 'Monitor' },
  { label: 'Chart History',     icon: CandlestickChart, href: '/admin/graph-requests',       section: 'Monitor' },
  { label: 'Subscriptions',     icon: CreditCard,      href: '/admin/subscriptions',         section: 'Finance' },
  { label: 'Analytics',         icon: BarChart3,       href: '/admin/analytics',             section: 'Platform' },
  { label: 'Advertisements',    icon: Megaphone,       href: '/admin/ads',                   section: 'Platform' },
  { label: 'Activity Logs',     icon: FileText,        href: '/admin/logs',                  section: 'Platform' },
  { label: 'Settings',          icon: Settings,        href: '/admin/settings',              section: 'System' },
]

const SELLER_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/seller', section: 'Main' },
  { label: 'My Businesses', icon: Building2, href: '/seller/businesses', section: 'Main' },
  { label: 'Inbox', icon: Inbox, href: '/seller/inbox', section: 'Main' },
  { label: 'Investors', icon: Users, href: '/seller/investors', section: 'Management' },
  { label: 'Investments', icon: TrendingUp, href: '/seller/investments', section: 'Management' },
  { label: 'Withdrawals', icon: ArrowDownToLine, href: '/seller/withdrawals', section: 'Finance' },
  { label: 'Reports', icon: BarChart3, href: '/seller/reports', section: 'Finance' },
  { label: 'Settings', icon: Settings, href: '/seller/settings', section: 'System' },
]

const INVESTOR_NAV: NavItem[] = [
  { label: 'Marketplace',       icon: Store,         href: '/investor/marketplace', section: 'Discover' },
  { label: 'Messages',          icon: MessageSquare, href: '/investor/chat',        section: 'Discover' },
  { label: 'Work with Platform', icon: BrainCircuit, href: '/investor/platform',    section: 'Discover' },
  { label: 'My Investments',    icon: TrendingUp,    href: '/investor/investments', section: 'Portfolio' },
]

const NAV_MAP: Record<string, NavItem[]> = {
  SUPER_ADMIN: ADMIN_NAV,
  SELLER: SELLER_NAV,
  INVESTOR: INVESTOR_NAV,
}

const BRAND_MAP: Record<string, { label: string; color: string; icon: any }> = {
  SUPER_ADMIN: { label: 'Admin Console', color: 'text-violet-400', icon: ShieldCheck },
  SELLER: { label: 'Seller Portal', color: 'text-brand-400', icon: TrendingUp },
  INVESTOR: { label: 'Investor Hub', color: 'text-emerald-400', icon: Wallet },
}

interface SidebarProps {
  role: string
}

export function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { unreadCount } = useNotificationsStore()

  const navItems = NAV_MAP[role] || INVESTOR_NAV
  const brand = BRAND_MAP[role] || BRAND_MAP.INVESTOR

  // Group nav items by section
  const sections = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    const sec = item.section || 'Main'
    if (!acc[sec]) acc[sec] = []
    acc[sec].push(item)
    return acc
  }, {})

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 p-6 border-b border-border',
        collapsed && 'justify-center px-4',
      )}>
        <div className="relative flex-shrink-0">
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center',
            role === 'SUPER_ADMIN' ? 'bg-violet-500/20' :
            role === 'SELLER' ? 'bg-brand-500/20' : 'bg-emerald-500/20',
          )}>
            <brand.icon className={cn('w-5 h-5', brand.color)} />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-background" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">InvestorPanel</p>
              <p className={cn('text-sm font-bold whitespace-nowrap font-display', brand.color)}>
                {brand.label}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {Object.entries(sections).map(([section, items]) => (
          <div key={section}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="section-title px-3 mb-1"
                >
                  {section}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                  >
                    <motion.div
                      whileHover={{ x: collapsed ? 0 : 3 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative group',
                        collapsed ? 'justify-center' : '',
                        isActive
                          ? cn(
                              'text-foreground',
                              role === 'SUPER_ADMIN' ? 'bg-violet-500/10 text-violet-300' :
                              role === 'SELLER' ? 'bg-brand-500/10 text-brand-300' :
                              'bg-emerald-500/10 text-emerald-300',
                            )
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
                      )}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="nav-active"
                          className={cn(
                            'absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full',
                            role === 'SUPER_ADMIN' ? 'bg-violet-400' :
                            role === 'SELLER' ? 'bg-brand-400' : 'bg-emerald-400',
                          )}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}

                      <item.icon className={cn(
                        'w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200',
                        isActive && 'scale-110',
                      )} />

                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden whitespace-nowrap flex-1"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Badge */}
                      {!collapsed && item.label === 'Notifications' && unreadCount > 0 && (
                        <span className="ml-auto text-xs font-bold bg-brand-500 text-obsidian-950 rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                      {!collapsed && item.badge !== undefined && item.label !== 'Notifications' && (
                        <span className="ml-auto text-xs font-bold bg-amber-500 text-obsidian-950 rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {item.badge}
                        </span>
                      )}

                      {/* Tooltip when collapsed */}
                      {collapsed && (
                        <div className="absolute left-full ml-3 px-2 py-1 bg-obsidian-900 text-foreground text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-border">
                          {item.label}
                        </div>
                      )}
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className={cn(
        'p-4 border-t border-border',
        collapsed ? 'flex flex-col items-center gap-2' : '',
      )}>
        {!collapsed && (
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-sm font-bold text-obsidian-950 flex-shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => logout()}
          className={cn(
            'flex items-center gap-2 text-xs text-muted-foreground hover:text-red-400 transition-colors rounded-lg p-2 hover:bg-red-500/5 w-full',
            collapsed ? 'justify-center' : '',
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="hidden lg:flex flex-col h-screen bg-obsidian-950 border-r border-border relative flex-shrink-0 overflow-hidden"
        style={{ backgroundImage: 'linear-gradient(180deg, #0a1628 0%, #0d1f36 50%, #0a1628 100%)' }}
      >
        <SidebarContent />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-6 -right-3 w-6 h-6 bg-obsidian-900 border border-border rounded-full flex items-center justify-center hover:bg-obsidian-800 transition-colors z-10"
        >
          {collapsed
            ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            : <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
          }
        </button>
      </motion.aside>

      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-obsidian-900 border border-border flex items-center justify-center"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 h-full w-72 bg-obsidian-950 border-r border-border z-50 overflow-hidden"
              style={{ backgroundImage: 'linear-gradient(180deg, #0a1628 0%, #0d1f36 50%, #0a1628 100%)' }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
