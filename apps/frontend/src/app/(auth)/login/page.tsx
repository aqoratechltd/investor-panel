'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, TrendingUp, Eye, EyeOff, ArrowRight, Shield,
  Phone, MessageSquare, RefreshCw, CheckCircle, AlertCircle,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/lib/utils'

// ── Schemas ────────────────────────────────────────────────────────────────
const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
const phoneSchema = z.object({
  phone: z.string().min(10, 'Enter a valid phone number with country code'),
})
const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

type EmailForm = z.infer<typeof emailSchema>
type PhoneForm = z.infer<typeof phoneSchema>
type OtpForm = z.infer<typeof otpSchema>

// ── Main Page ──────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [tab, setTab] = useState<'email' | 'phone'>('email')
  const [showPassword, setShowPassword] = useState(false)
  const [otpStep, setOtpStep] = useState(false)
  const [confirmationResult, setConfirmationResult] = useState<any>(null)
  const [pendingVerification] = useState(false)
  const [otpCooldown, setOtpCooldown] = useState(0)
  const recaptchaRef = useRef<HTMLDivElement>(null)
  const cooldownRef = useRef<NodeJS.Timeout | null>(null)

  const { login, loginWithPhone, sendPhoneOTP, isLoading } = useAuthStore()
  const router = useRouter()

  // OTP cooldown timer
  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }
  }, [])

  const startCooldown = () => {
    setOtpCooldown(60)
    cooldownRef.current = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  // Email/password form
  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) })
  // Phone form
  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) })
  // OTP form
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) })

  const getInvestorRoute = async (userId: string) => {
    try {
      const { db, isFirebaseConfigured } = await import('@/lib/firebase')
      if (!isFirebaseConfigured()) return '/investor/marketplace'
      const { doc, getDoc } = await import('firebase/firestore')
      const snap = await getDoc(doc(db, 'investor_profiles', userId))
      if (!snap.exists() || !snap.data().onboardingCompleted) return '/investor/onboarding'
    } catch {}
    return '/investor/marketplace'
  }

  const getSellerRoute = async (userId: string) => {
    try {
      const { db, isFirebaseConfigured } = await import('@/lib/firebase')
      if (!isFirebaseConfigured()) return '/seller'
      const { doc, getDoc } = await import('firebase/firestore')
      const snap = await getDoc(doc(db, 'seller_applications', userId))
      if (!snap.exists()) return '/seller/onboarding'
      const status = snap.data().status
      if (status === 'PENDING') return '/seller/pending'
      if (status === 'REJECTED') return '/seller/rejected'
    } catch {}
    return '/seller'
  }

  const onEmailSubmit = async (data: EmailForm) => {
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      const user = useAuthStore.getState().user
      if (user?.role === 'INVESTOR') {
        const route = await getInvestorRoute(user.id)
        router.push(route)
      } else if (user?.role === 'SELLER') {
        const route = await getSellerRoute(user.id)
        router.push(route)
      } else {
        router.push('/admin')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Invalid credentials')
    }
  }

  const onPhoneSend = async (data: PhoneForm) => {
    try {
      const result = await sendPhoneOTP(data.phone, 'recaptcha-container')
      setConfirmationResult(result)
      setOtpStep(true)
      startCooldown()
      toast.success('OTP sent! Check your phone.')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP. Check the number and try again.')
    }
  }

  const onOtpSubmit = async (data: OtpForm) => {
    if (!confirmationResult) return
    try {
      await loginWithPhone(confirmationResult, data.otp)
      toast.success('Phone verified! Welcome.')
      const user = useAuthStore.getState().user
      if (user?.role === 'INVESTOR') {
        const route = await getInvestorRoute(user.id)
        router.push(route)
      } else if (user?.role === 'SELLER') {
        const route = await getSellerRoute(user.id)
        router.push(route)
      } else {
        router.push('/admin')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Invalid OTP')
    }
  }

  return (
    <div className="flex w-full min-h-screen">
      {/* ── Left Branding Panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] xl:w-[560px] bg-obsidian-950 border-r border-border p-12 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-brand-500/5 blur-3xl pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Platform</p>
            <p className="text-lg font-display font-bold text-brand-400">InvestorPanel</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative z-10">
          <h2 className="text-4xl xl:text-5xl font-display font-bold leading-tight mb-6">
            Your investments,<br />
            <span className="bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent">amplified.</span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
            A multi-tenant SaaS investment platform that gives sellers and investors a professional-grade experience for tracking and growing portfolios.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { value: '$2.4B+', label: 'Assets tracked' },
              { value: '14K+', label: 'Active investors' },
              { value: '99.9%', label: 'Uptime SLA' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="glass-card p-4">
                <p className="text-xl font-display font-bold text-brand-400">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex items-center gap-2 relative z-10">
          <Shield className="w-4 h-4 text-brand-400" />
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">Firebase-secured</span> · Email + Phone OTP · Firestore DB
          </p>
        </motion.div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-brand-400" />
            </div>
            <span className="font-display font-bold text-brand-400">InvestorPanel</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-display font-bold">Sign in</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">Create one free</Link>
            </p>
          </div>

          {/* Email verification pending banner */}
          <AnimatePresence>
            {pendingVerification && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-5 flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/8"
              >
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-300">Email not verified</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Check your inbox and click the verification link.{' '}
                    <button
                      onClick={async () => {
                        const { resendEmailVerification } = useAuthStore.getState()
                        await resendEmailVerification()
                        toast.success('Verification email resent!')
                      }}
                      className="text-brand-400 hover:underline font-medium"
                    >
                      Resend email
                    </button>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab toggle: Email vs Phone */}
          <div className="flex items-center bg-muted/40 rounded-xl p-1 mb-6 border border-border">
            {[
              { key: 'email', icon: Mail, label: 'Email' },
              { key: 'phone', icon: Phone, label: 'Phone OTP' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => { setTab(key as any); setOtpStep(false) }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
                  tab === key
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* ── Email/Password form ── */}
          <AnimatePresence mode="wait">
            {tab === 'email' && (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Email address</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    leftIcon={<Mail className="w-4 h-4" />}
                    error={emailForm.formState.errors.email?.message}
                    {...emailForm.register('email')}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                    <Link href="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">Forgot password?</Link>
                  </div>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    error={emailForm.formState.errors.password?.message}
                    {...emailForm.register('password')}
                  />
                </div>
                <Button type="submit" size="lg" className="w-full mt-2 gap-2 font-semibold" loading={isLoading}>
                  Sign in <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.form>
            )}

            {/* ── Phone OTP form ── */}
            {tab === 'phone' && !otpStep && (
              <motion.form
                key="phone"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                onSubmit={phoneForm.handleSubmit(onPhoneSend)}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Phone number</label>
                  <Input
                    type="tel"
                    placeholder="+1 555 000 0000"
                    leftIcon={<Phone className="w-4 h-4" />}
                    error={phoneForm.formState.errors.phone?.message}
                    {...phoneForm.register('phone')}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1.5">Include country code, e.g. +44 7700 900000</p>
                </div>

                {/* Invisible reCAPTCHA */}
                <div id="recaptcha-container" ref={recaptchaRef} />

                <Button type="submit" size="lg" className="w-full gap-2 font-semibold" loading={isLoading}>
                  <MessageSquare className="w-4 h-4" />
                  Send OTP
                </Button>
              </motion.form>
            )}

            {/* ── OTP input ── */}
            {tab === 'phone' && otpStep && (
              <motion.form
                key="otp"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={otpForm.handleSubmit(onOtpSubmit)}
                className="space-y-4"
              >
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    OTP sent to <span className="text-foreground font-medium">{phoneForm.getValues('phone')}</span>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Enter 6-digit OTP</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    leftIcon={<MessageSquare className="w-4 h-4" />}
                    error={otpForm.formState.errors.otp?.message}
                    className="text-center tracking-[0.5em] text-lg font-mono"
                    {...otpForm.register('otp')}
                  />
                </div>

                <Button type="submit" size="lg" className="w-full gap-2 font-semibold" loading={isLoading}>
                  Verify OTP <ArrowRight className="w-4 h-4" />
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    disabled={otpCooldown > 0}
                    onClick={() => phoneForm.handleSubmit(onPhoneSend)()}
                    className="text-xs text-muted-foreground hover:text-brand-400 transition-colors disabled:opacity-40 flex items-center gap-1 mx-auto"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-brand-400 hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-brand-400 hover:underline">Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
