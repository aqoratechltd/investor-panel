'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useInvestorStore } from '@/stores/investor.store'

const ALLOWED_PATHS = ['/investor/marketplace', '/investor/chat', '/investor/onboarding']

export default function InvestorLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore()
  const { initialize, isLoaded }  = useInvestorStore()
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'INVESTOR') {
      setChecked(true)
      return
    }

    // Enforce allowed paths
    const isAllowed = ALLOWED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'))
    if (!isAllowed) {
      router.replace('/investor/marketplace')
      return
    }

    // Skip onboarding check if already on onboarding
    if (pathname === '/investor/onboarding') {
      setChecked(true)
      return
    }

    const checkOnboarding = async () => {
      try {
        const { db, isFirebaseConfigured } = await import('@/lib/firebase')
        if (!isFirebaseConfigured()) { setChecked(true); return }
        const { doc, getDoc } = await import('firebase/firestore')
        const snap = await getDoc(doc(db, 'investor_profiles', user!.id))
        if (!snap.exists() || !snap.data().onboardingCompleted) {
          router.replace('/investor/onboarding')
          return
        }
      } catch {}
      setChecked(true)
    }

    checkOnboarding()
  }, [isAuthenticated, user, pathname, router])

  // Seed the investor store from Firestore once per user session
  useEffect(() => {
    if (user?.id && !isLoaded) initialize(user.id)
  }, [user?.id, isLoaded, initialize])

  if (!checked) {
    return (
      <div className="flex items-center justify-center h-screen bg-obsidian-950">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
