'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, CheckCircle, RefreshCw, ArrowRight, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth.store'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''
  const [cooldown, setCooldown] = useState(60)
  const [checking, setChecking] = useState(false)
  const { resendEmailVerification } = useAuthStore()

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleResend = async () => {
    try {
      await resendEmailVerification()
      setCooldown(60)
      toast.success('Verification email resent!')
    } catch {
      toast.error('Failed to resend. Please try again.')
    }
  }

  const handleCheckVerified = async () => {
    setChecking(true)
    try {
      const { auth, isFirebaseConfigured } = await import('@/lib/firebase')
      if (!isFirebaseConfigured()) {
        router.push('/login')
        return
      }
      // Reload the current Firebase user to get fresh emailVerified status
      const currentUser = auth.currentUser
      if (currentUser) {
        await currentUser.reload()
        if (currentUser.emailVerified) {
          toast.success('Email verified! Redirecting...')
          setTimeout(() => router.push('/login'), 1000)
        } else {
          toast.error('Email not verified yet. Check your inbox.')
        }
      } else {
        router.push('/login')
      }
    } catch {
      toast.error('Could not check verification status.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md text-center"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-brand-400" />
          </div>
          <span className="font-display font-bold text-brand-400 text-lg">InvestorPanel</span>
        </div>

        {/* Icon */}
        <div className="relative mx-auto w-24 h-24 mb-8">
          <div className="w-24 h-24 rounded-3xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto">
            <Mail className="w-10 h-10 text-brand-400" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="w-3.5 h-3.5 text-obsidian-950" />
          </motion.div>
        </div>

        <h1 className="text-2xl font-display font-bold mb-3">Check your inbox</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-2">
          We&apos;ve sent a verification link to:
        </p>
        <p className="text-brand-400 font-medium font-mono text-sm mb-6">{email}</p>

        <p className="text-xs text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
          Click the link in the email to verify your account. Once verified, you can sign in. Check your spam folder if you don&apos;t see it.
        </p>

        {/* Steps */}
        <div className="space-y-3 mb-8 text-left">
          {[
            { step: '1', text: 'Open the email from InvestorPanel' },
            { step: '2', text: 'Click the "Verify email address" button' },
            { step: '3', text: 'Return here and click "I\'ve verified" below' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-400 flex-shrink-0">
                {step}
              </div>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Button onClick={handleCheckVerified} loading={checking} className="w-full gap-2">
            <CheckCircle className="w-4 h-4" />
            I&apos;ve verified my email
            <ArrowRight className="w-4 h-4" />
          </Button>

          <button
            onClick={handleResend}
            disabled={cooldown > 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend verification email'}
          </button>

          <button
            onClick={() => router.push('/login')}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Back to sign in
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
