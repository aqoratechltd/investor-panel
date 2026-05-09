'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useSellerStore } from '@/stores/seller.store'

// Direct-to-Market: PENDING/REJECTED gates removed. Only check for missing onboarding.
// TO RE-ENABLE: Restore PENDING → /seller/pending and REJECTED → /seller/rejected checks.
const BYPASS_PATHS = [
  '/seller/onboarding',
  '/seller/businesses',
  '/seller/inbox',
  '/seller/withdrawals',
  '/seller/reports',
  '/seller/portfolio-manager',
  '/seller/investors',
  '/seller/investments',
  '/seller/settings',
  '/seller',
]

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore()
  const { initialize, isLoaded } = useSellerStore()
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)
  const checkedUserId = useRef<string | null>(null)

  // Seed seller store from Firestore once per session
  useEffect(() => {
    if (user?.id && user.role === 'SELLER' && !isLoaded) {
      initialize(user.id, `${user.firstName} ${user.lastName}`)
    }
  }, [user?.id, user?.role, isLoaded, initialize])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'SELLER') {
      setChecked(true)
      return
    }

    if (BYPASS_PATHS.some(p => pathname.startsWith(p))) {
      setChecked(true)
      return
    }

    // Only run the Firestore check once per user session
    if (checkedUserId.current === user!.id) {
      setChecked(true)
      return
    }

    const checkApplication = async () => {
      try {
        const { db, isFirebaseConfigured } = await import('@/lib/firebase')
        if (!isFirebaseConfigured()) { setChecked(true); return }
        const { doc, getDoc } = await import('firebase/firestore')
        const snap = await getDoc(doc(db, 'seller_applications', user!.id))

        // Send to onboarding only if application doesn't exist yet
        if (!snap.exists()) {
          checkedUserId.current = user!.id
          router.replace('/seller/onboarding')
          return
        }
        // All statuses (APPROVED) are allowed through — no PENDING/REJECTED redirect
      } catch {}
      checkedUserId.current = user!.id
      setChecked(true)
    }

    checkApplication()
  }, [isAuthenticated, user?.id, pathname])

  if (!checked) {
    return (
      <div className="flex items-center justify-center h-screen bg-obsidian-950">
        <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
