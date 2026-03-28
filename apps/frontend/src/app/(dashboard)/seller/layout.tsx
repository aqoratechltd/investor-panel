'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'

const BYPASS_PATHS = ['/seller/onboarding', '/seller/pending', '/seller/rejected', '/seller/businesses', '/seller/inbox']

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)
  const checkedUserId = useRef<string | null>(null)

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
    if (checkedUserId.current === user!.id) return

    const checkApplication = async () => {
      try {
        const { db, isFirebaseConfigured } = await import('@/lib/firebase')
        if (!isFirebaseConfigured()) { setChecked(true); return }
        const { doc, getDoc } = await import('firebase/firestore')
        const snap = await getDoc(doc(db, 'seller_applications', user!.id))

        if (!snap.exists()) {
          checkedUserId.current = user!.id
          router.replace('/seller/onboarding')
          return
        }

        const status = snap.data().status
        if (status === 'PENDING') { checkedUserId.current = user!.id; router.replace('/seller/pending'); return }
        if (status === 'REJECTED') { checkedUserId.current = user!.id; router.replace('/seller/rejected'); return }
        // APPROVED — allow through
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
