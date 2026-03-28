'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { XCircle, Mail, RefreshCw, Clock, FileText, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'next/navigation'

export default function SellerRejectedPage() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const [checking, setChecking] = useState(false)
  const [canReapply, setCanReapply] = useState(false)
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null)
  const [loaded, setLoaded] = useState(false)

  const loadDetails = async () => {
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, getDoc } = await import('firebase/firestore')
      const snap = await getDoc(doc(db, 'seller_applications', user!.id))
      if (snap.exists()) {
        const data = snap.data()
        setRejectionReason(data.rejectionReason || null)
        const locked = data.lockedUntil?.toDate?.() || new Date(data.lockedUntil)
        setLockedUntil(locked)
        setCanReapply(new Date() > locked)
      }
    } catch {}
    setLoaded(true)
  }

  if (!loaded) {
    loadDetails()
  }

  const handleCheckStatus = async () => {
    setChecking(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, getDoc } = await import('firebase/firestore')
      const snap = await getDoc(doc(db, 'seller_applications', user!.id))
      if (snap.exists()) {
        const data = snap.data()
        const locked = data.lockedUntil?.toDate?.() || new Date(data.lockedUntil)
        setLockedUntil(locked)
        setCanReapply(new Date() > locked)
        setRejectionReason(data.rejectionReason || null)
        if (data.status === 'APPROVED') {
          router.push('/seller')
          return
        }
      }
    } catch {}
    setChecking(false)
  }

  const handleReapply = async () => {
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, deleteDoc } = await import('firebase/firestore')
      await deleteDoc(doc(db, 'seller_applications', user!.id))
      router.push('/seller/onboarding')
    } catch {}
  }

  const formatDate = (d: Date | null) => {
    if (!d) return '—'
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center p-4"
      style={{ backgroundImage: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(239,68,68,0.05), transparent)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg text-center">

        <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold font-display mb-3">Application Not Approved</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          After reviewing your seller application, our team has decided not to approve it at this time.
          You may reapply after the lock period ends.
        </p>

        {rejectionReason && (
          <div className="glass-card rounded-2xl p-5 mb-6 text-left border border-red-500/20 bg-red-500/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-400 mb-1">Reason for rejection</p>
                <p className="text-sm text-muted-foreground">{rejectionReason}</p>
              </div>
            </div>
          </div>
        )}

        <div className="glass-card rounded-2xl p-6 mb-6 text-left space-y-4">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your options</p>
          {[
            {
              icon: Clock,
              color: 'text-amber-400',
              text: lockedUntil
                ? `Reapply after ${formatDate(lockedUntil)}`
                : 'Lock period: 30 days from original submission',
            },
            { icon: Mail, color: 'text-violet-400', text: 'A rejection notice has been sent to your email' },
            { icon: FileText, color: 'text-brand-400', text: 'Review our seller eligibility requirements before reapplying' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <item.icon className={`w-4 h-4 ${item.color} flex-shrink-0 mt-0.5`} />
              <span className="text-sm text-muted-foreground">{item.text}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {canReapply ? (
            <button onClick={handleReapply}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 text-obsidian-950 text-sm font-semibold hover:bg-brand-400 transition-all">
              <FileText className="w-4 h-4" /> Reapply Now
            </button>
          ) : (
            <button onClick={handleCheckStatus} disabled={checking}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking…' : 'Check Lock Period'}
            </button>
          )}
          <button onClick={() => logout()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-obsidian-800 text-sm font-medium hover:bg-obsidian-700 transition-all">
            Sign Out
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Logged in as <span className="text-foreground">{user?.email}</span>
        </p>
      </motion.div>
    </div>
  )
}
