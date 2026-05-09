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

// True once the first DashboardLayout has mounted on the client.
// Subsequent instances (client-side navigation) start with mounted=true,
// preventing the loading flash. Always starts false so SSR and first client
// render agree — no hydration mismatch.
let _appMounted = false

export function DashboardLayout({ children, role, title, subtitle }: DashboardLayoutProps) {
  const { user, isAuthenticated, initialize } = useAuthStore()
  const { fetch: fetchNotifications } = useNotificationsStore()
  const router = useRouter()
  const fetchRef = useRef(fetchNotifications)
  fetchRef.current = fetchNotifications

  const [mounted, setMounted] = useState(_appMounted)
  useEffect(() => { _appMounted = true; setMounted(true) }, [])

  useEffect(() => { initialize() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mounted) return
    const t = setTimeout(() => {
      if (!isAuthenticated) { router.push('/login'); return }
      if (user && user.role !== role) {
        const roleRoutes: Record<string, string> = {
          SUPER_ADMIN: '/admin', SELLER: '/seller', INVESTOR: '/investor',
        }
        router.push(roleRoutes[user.role] || '/login')
      }
    }, 2000)
    return () => clearTimeout(t)
  }, [mounted, isAuthenticated, user?.role, role]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    fetchRef.current(user.id)
  }, [isAuthenticated, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian-950">
        <div className="w-8 h-8 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
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
