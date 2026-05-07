'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationsStore } from '@/stores/notifications.store'

interface DashboardLayoutProps {
  children: React.ReactNode
  role: 'SUPER_ADMIN' | 'SELLER' | 'INVESTOR'
  title?: string
  subtitle?: string
}

export function DashboardLayout({ children, role, title, subtitle }: DashboardLayoutProps) {
  const { user, isAuthenticated, initialize } = useAuthStore()
  const { fetch: fetchNotifications } = useNotificationsStore()
  const router = useRouter()
  const fetchRef = useRef(fetchNotifications)
  fetchRef.current = fetchNotifications

  // `mounted` is false on the server and on the first client render.
  // Only after it becomes true do we know the Zustand store has read
  // from localStorage — so we never redirect on stale SSR state.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Run initialize only once on mount
  useEffect(() => { initialize() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auth guard — 2 second delay so debug panel is readable before any redirect
  useEffect(() => {
    if (!mounted) return
    const t = setTimeout(() => {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }
      if (user && user.role !== role) {
        const roleRoutes: Record<string, string> = {
          SUPER_ADMIN: '/admin',
          SELLER: '/seller',
          INVESTOR: '/investor',
        }
        router.push(roleRoutes[user.role] || '/login')
      }
    }, 2000)
    return () => clearTimeout(t)
  }, [mounted, isAuthenticated, user?.role, role]) // eslint-disable-line react-hooks/exhaustive-deps

  // Notifications listener
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    fetchRef.current(user.id)
  }, [isAuthenticated, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debug: show state when stuck (remove after fix is confirmed)
  if (!mounted || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian-950">
        <div className="flex flex-col items-center gap-4 p-8 glass-card rounded-2xl max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm font-semibold">Auth Debug</p>
          <div className="text-xs text-left w-full space-y-1 font-mono bg-black/30 p-3 rounded-xl">
            <p>mounted: <span className={mounted ? 'text-emerald-400' : 'text-red-400'}>{String(mounted)}</span></p>
            <p>isAuthenticated: <span className={isAuthenticated ? 'text-emerald-400' : 'text-red-400'}>{String(isAuthenticated)}</span></p>
            <p>user: <span className={user ? 'text-emerald-400' : 'text-red-400'}>{user ? user.email : 'null'}</span></p>
            <p>role: <span className="text-brand-400">{user?.role ?? 'none'}</span></p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={role} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar title={title} subtitle={subtitle} />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
