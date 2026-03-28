'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, TrendingUp, CheckCircle, Phone } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth.store'

const schema = z.object({
  firstName: z.string().min(2, 'First name too short'),
  lastName: z.string().min(2, 'Last name too short'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  role: z.enum(['SELLER', 'INVESTOR']),
  agreeTerms: z.literal(true, { errorMap: () => ({ message: 'You must agree to terms' }) }),
})
type FormData = z.infer<typeof schema>

const FEATURES = [
  'Real-time portfolio tracking',
  'Custom investment channels & coins',
  'Automated profit/loss reporting',
  'Secure withdrawal management',
]

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { register: registerUser, isLoading } = useAuthStore()
  const router = useRouter()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'INVESTOR' },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: FormData) => {
    try {
      const result = await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
        role: data.role,
      })

      toast.success('Account created! Welcome.')
      if (data.role === 'INVESTOR') {
        router.push('/investor/onboarding')
      } else {
        router.push('/seller/onboarding')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Registration failed')
    }
  }

  return (
    <div className="flex w-full min-h-screen">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[440px] xl:w-[520px] bg-obsidian-950 border-r border-border p-12 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-3xl" />

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-brand-400" />
          </div>
          <span className="text-lg font-display font-bold text-brand-400">InvestorPanel</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="relative z-10">
          <h2 className="text-3xl xl:text-4xl font-display font-bold leading-tight mb-4">
            Start growing<br />
            <span className="bg-gradient-to-r from-brand-400 to-emerald-400 bg-clip-text text-transparent">
              your portfolio.
            </span>
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Join thousands of investors and sellers already using InvestorPanel to track and grow their investments.
          </p>

          <ul className="space-y-3">
            {FEATURES.map((f, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-muted-foreground">{f}</span>
              </motion.li>
            ))}
          </ul>

          {/* Security badges */}
          <div className="mt-8 grid grid-cols-3 gap-2">
            {[
              { label: 'Firebase Auth', sub: 'Secure login' },
              { label: 'Email OTP', sub: 'Verification' },
              { label: 'Phone OTP', sub: 'Mobile verify' },
            ].map((b, i) => (
              <div key={i} className="glass-card p-3 text-center">
                <p className="text-xs font-semibold text-brand-400">{b.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{b.sub}</p>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="mt-6 glass-card p-4 flex items-center gap-4">
            <div className="flex -space-x-2">
              {['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b'].map((color, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-obsidian-950 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: color + '33', color }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium">14,000+ users</p>
              <p className="text-xs text-muted-foreground">already signed up</p>
            </div>
          </div>
        </motion.div>

        <div className="relative z-10 text-xs text-muted-foreground">Free 14-day trial · No credit card required</div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">

          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-brand-400" />
            </div>
            <span className="font-display font-bold text-brand-400">InvestorPanel</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-display font-bold">Create account</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">Sign in</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role Toggle */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'INVESTOR', label: 'Investor', desc: 'Track my investments' },
                  { value: 'SELLER', label: 'Seller', desc: 'Manage investors' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                      selectedRole === option.value
                        ? 'border-brand-500/50 bg-brand-500/10'
                        : 'border-border bg-muted/20 hover:border-border/80'
                    }`}
                  >
                    <input type="radio" value={option.value} className="sr-only" {...register('role')} />
                    <p className={`text-sm font-semibold ${selectedRole === option.value ? 'text-brand-400' : 'text-foreground'}`}>{option.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{option.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">First Name</label>
                <Input placeholder="John" leftIcon={<User className="w-4 h-4" />} error={errors.firstName?.message} {...register('firstName')} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Last Name</label>
                <Input placeholder="Doe" error={errors.lastName?.message} {...register('lastName')} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Email</label>
              <Input type="email" placeholder="you@example.com" leftIcon={<Mail className="w-4 h-4" />} error={errors.email?.message} {...register('email')} />
            </div>

            {/* Phone (optional) */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                Phone <span className="normal-case text-muted-foreground/60 font-normal">(optional — for OTP login)</span>
              </label>
              <Input
                type="tel"
                placeholder="+1 555 000 0000"
                leftIcon={<Phone className="w-4 h-4" />}
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Password</label>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />
              {/* Password strength hints */}
              <div className="flex gap-3 mt-2">
                {[
                  { label: '8+ chars', met: (watch('password')?.length || 0) >= 8 },
                  { label: 'Uppercase', met: /[A-Z]/.test(watch('password') || '') },
                  { label: 'Number', met: /[0-9]/.test(watch('password') || '') },
                ].map(({ label, met }) => (
                  <span key={label} className={`text-[10px] flex items-center gap-1 ${met ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${met ? 'bg-emerald-400' : 'bg-muted-foreground/30'}`} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input type="checkbox" id="agreeTerms" className="mt-1 rounded border-border accent-brand-500" {...register('agreeTerms')} />
              <label htmlFor="agreeTerms" className="text-xs text-muted-foreground">
                I agree to the{' '}
                <Link href="/terms" className="text-brand-400 hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-brand-400 hover:underline">Privacy Policy</Link>
              </label>
            </div>
            {errors.agreeTerms && <p className="text-xs text-red-400 -mt-2">{errors.agreeTerms.message}</p>}

            {/* Email verification info */}
            <div className="p-3 rounded-xl border border-brand-500/20 bg-brand-500/5 flex items-start gap-2.5">
              <Mail className="w-3.5 h-3.5 text-brand-400 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                A verification email will be sent to your inbox. You&apos;ll need to verify before signing in.
              </p>
            </div>

            <Button type="submit" size="lg" className="w-full gap-2 font-semibold" loading={isLoading}>
              Create account <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
