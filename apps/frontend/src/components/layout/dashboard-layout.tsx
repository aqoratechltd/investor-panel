'use client'

import { useEffect, useRef } from 'react'
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

  // Run initialize only once on mount
  useEffect(() => {
    initialize()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
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
  }, [isAuthenticated, user?.role, role]) // eslint-disable-line react-hooks/exhaustive-deps

  // Start real-time notifications listener when user is available
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    fetchRef.current(user.id)
  }, [isAuthenticated, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center animate-pulse-glow">
            <div className="w-6 h-6 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
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
