'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useAdminStore } from '@/stores/admin.store'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const { initialize, isLoaded } = useAdminStore()

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' && !isLoaded) initialize()
  }, [user?.role, isLoaded, initialize])

  return <>{children}</>
}
