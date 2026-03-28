'use client'

import { motion } from 'framer-motion'
import { Clock, CheckCircle2, Mail, Building2, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'next/navigation'

export default function SellerPendingPage() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleRefresh = async () => {
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, getDoc } = await import('firebase/firestore')
      const snap = await getDoc(doc(db, 'seller_applications', user!.id))
      if (snap.exists() && snap.data().status === 'APPROVED') {
        router.push('/seller')
      } else {
        // still pending
      }
    } catch {}
  }

  return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center p-4"
      style={{ backgroundImage: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(6,182,212,0.06), transparent)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg text-center">

        <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-amber-400" />
        </div>

        <h1 className="text-2xl font-bold font-display mb-3">Application Under Review</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Your seller application has been submitted successfully. Our team will review your business details,
          financials, and P&L statement within <span className="text-foreground font-semibold">48 hours</span>.
          You'll receive an email once a decision is made.
        </p>

        <div className="glass-card rounded-2xl p-6 mb-6 text-left space-y-4">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">What happens next</p>
          {[
            { icon: CheckCircle2, color: 'text-emerald-400', text: 'Application submitted & timestamp locked for 30 days' },
            { icon: Building2, color: 'text-brand-400', text: 'Admin reviews your business info, financials & P&L file' },
            { icon: Mail, color: 'text-violet-400', text: 'You receive an approval or rejection email within 48 hours' },
            { icon: CheckCircle2, color: 'text-emerald-400', text: 'Approved? Full seller dashboard access granted immediately' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <item.icon className={`w-4 h-4 ${item.color} flex-shrink-0 mt-0.5`} />
              <span className="text-sm text-muted-foreground">{item.text}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={handleRefresh}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
            <RefreshCw className="w-4 h-4" /> Check Status
          </button>
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
