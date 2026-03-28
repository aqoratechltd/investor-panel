'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/auth.store'
import {
  User, Building2, TrendingUp, Target, ChevronRight, ChevronLeft,
  CheckCircle2, DollarSign, Globe, Briefcase, BarChart3, Shield,
} from 'lucide-react'
import toast from 'react-hot-toast'

const SECTORS = [
  'Technology', 'Real Estate', 'Healthcare', 'Finance', 'Food & Beverage',
  'E-commerce', 'Education', 'Manufacturing', 'Energy', 'Logistics',
]

const COUNTRIES = [
  'Pakistan', 'United States', 'United Kingdom', 'UAE', 'Saudi Arabia',
  'Canada', 'Australia', 'Germany', 'India', 'Singapore',
]

const GOALS = [
  'Long-term wealth building', 'Passive income generation', 'Portfolio diversification',
  'High-growth opportunities', 'Stable returns', 'Social impact investing',
]

const STEPS = [
  { icon: User, label: 'Personal Info', color: 'emerald' },
  { icon: Briefcase, label: 'Background', color: 'cyan' },
  { icon: DollarSign, label: 'Capital', color: 'violet' },
  { icon: Target, label: 'Preferences', color: 'amber' },
]

export default function InvestorOnboarding() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    phone: user?.phone || '',
    country: 'Pakistan',
    businessName: '',
    industry: '',
    experience: 'Beginner',
    capitalAvailable: '',
    portfolioSize: '',
    riskTolerance: 'MEDIUM',
    preferredSectors: [] as string[],
    investmentGoals: [] as string[],
  })

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))
  const toggleSector = (s: string) => setForm(p => ({
    ...p,
    preferredSectors: p.preferredSectors.includes(s)
      ? p.preferredSectors.filter(x => x !== s)
      : [...p.preferredSectors, s],
  }))
  const toggleGoal = (g: string) => setForm(p => ({
    ...p,
    investmentGoals: p.investmentGoals.includes(g)
      ? p.investmentGoals.filter(x => x !== g)
      : [...p.investmentGoals, g],
  }))

  const handleFinish = async () => {
    setSaving(true)
    try {
      const { db, isFirebaseConfigured } = await import('@/lib/firebase')
      if (!isFirebaseConfigured()) throw new Error('Firebase not configured')
      const { doc, setDoc } = await import('firebase/firestore')

      await setDoc(doc(db, 'investor_profiles', user!.id), {
        ...form,
        capitalAvailable: parseFloat(form.capitalAvailable) || 0,
        portfolioSize: parseFloat(form.portfolioSize) || 0,
        userId: user!.id,
        email: user!.email,
        onboardingCompleted: true,
        completedAt: new Date().toISOString(),
      })

      // Update user display name in Firestore if changed
      const nameParts = form.fullName.trim().split(' ')
      const firstName = nameParts[0] || user!.firstName
      const lastName = nameParts.slice(1).join(' ') || user!.lastName
      await setDoc(doc(db, 'users', user!.id), { firstName, lastName }, { merge: true })

      setUser({ ...user!, firstName, lastName })
      toast.success('Profile complete! Welcome to the marketplace.')
      router.push('/investor/marketplace')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const canNext = () => {
    if (step === 0) return form.fullName.trim().length > 0 && form.country
    if (step === 1) return form.experience
    if (step === 2) return form.capitalAvailable && parseFloat(form.capitalAvailable) > 0
    return form.preferredSectors.length > 0 && form.investmentGoals.length > 0
  }

  return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center p-4"
      style={{ backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,185,129,0.08), transparent)' }}>

      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Account created — complete your investor profile
          </div>
          <h1 className="text-3xl font-bold font-display mb-2">
            Tell us about <span className="text-emerald-400">yourself</span>
          </h1>
          <p className="text-muted-foreground">We'll personalise your investment recommendations</p>
        </motion.div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <motion.div
                animate={{ scale: i === step ? 1.1 : 1 }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  i < step ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  i === step ? 'bg-emerald-500 text-obsidian-950' :
                  'bg-obsidian-800 text-muted-foreground border border-border'
                }`}
              >
                {i < step ? <CheckCircle2 className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </motion.div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-px ${i < step ? 'bg-emerald-500/50' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
          className="glass-card rounded-2xl p-8"
        >
          {step === 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Personal Information</h2>
                  <p className="text-sm text-muted-foreground">Let's start with the basics</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Full Name *</label>
                <input
                  value={form.fullName}
                  onChange={e => set('fullName', e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-obsidian-800 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Phone Number</label>
                <input
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+92 300 0000000"
                  className="w-full bg-obsidian-800 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Country *</label>
                <select
                  value={form.country}
                  onChange={e => set('country', e.target.value)}
                  className="w-full bg-obsidian-800 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Business Background</h2>
                  <p className="text-sm text-muted-foreground">Tell us about your professional background</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Business / Company Name <span className="text-muted-foreground/60">(optional)</span></label>
                <input
                  value={form.businessName}
                  onChange={e => set('businessName', e.target.value)}
                  placeholder="e.g. Acme Ventures"
                  className="w-full bg-obsidian-800 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Industry / Field</label>
                <input
                  value={form.industry}
                  onChange={e => set('industry', e.target.value)}
                  placeholder="e.g. Technology, Real Estate..."
                  className="w-full bg-obsidian-800 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Investment Experience *</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Beginner', 'Intermediate', 'Expert'].map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => set('experience', lvl)}
                      className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                        form.experience === lvl
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                          : 'bg-obsidian-800 border-border text-muted-foreground hover:border-cyan-500/30'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Capital & Portfolio</h2>
                  <p className="text-sm text-muted-foreground">Help us understand your financial capacity</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Capital Available to Invest (USD) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    type="number"
                    value={form.capitalAvailable}
                    onChange={e => set('capitalAvailable', e.target.value)}
                    placeholder="50,000"
                    min="0"
                    className="w-full bg-obsidian-800 border border-border rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {['10000', '50000', '100000', '500000'].map(v => (
                    <button key={v} type="button" onClick={() => set('capitalAvailable', v)}
                      className="text-xs px-2 py-1 rounded-lg bg-obsidian-800 border border-border text-muted-foreground hover:border-violet-500/30 hover:text-violet-300 transition-colors">
                      ${parseInt(v).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Previous Portfolio Size (USD) <span className="text-muted-foreground/60">(optional)</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    type="number"
                    value={form.portfolioSize}
                    onChange={e => set('portfolioSize', e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full bg-obsidian-800 border border-border rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Risk Tolerance</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'LOW', label: 'Conservative', color: 'emerald' },
                    { value: 'MEDIUM', label: 'Moderate', color: 'amber' },
                    { value: 'HIGH', label: 'Aggressive', color: 'red' },
                  ].map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => set('riskTolerance', r.value)}
                      className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                        form.riskTolerance === r.value
                          ? r.color === 'emerald' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : r.color === 'amber' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-red-500/20 border-red-500/50 text-red-300'
                          : 'bg-obsidian-800 border-border text-muted-foreground hover:border-white/20'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Preferences & Goals</h2>
                  <p className="text-sm text-muted-foreground">Personalise your recommendations</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">Preferred Investment Sectors * <span className="text-muted-foreground/60">(pick at least 1)</span></label>
                <div className="flex flex-wrap gap-2">
                  {SECTORS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSector(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        form.preferredSectors.includes(s)
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-obsidian-800 border-border text-muted-foreground hover:border-amber-500/30'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">Investment Goals * <span className="text-muted-foreground/60">(pick at least 1)</span></label>
                <div className="space-y-2">
                  {GOALS.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGoal(g)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all flex items-center gap-3 ${
                        form.investmentGoals.includes(g)
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                          : 'bg-obsidian-800 border-border text-muted-foreground hover:border-amber-500/20'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                        form.investmentGoals.includes(g)
                          ? 'bg-amber-500 border-amber-500'
                          : 'border-border'
                      }`}>
                        {form.investmentGoals.includes(g) && (
                          <CheckCircle2 className="w-3 h-3 text-obsidian-950" />
                        )}
                      </div>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <span className="text-xs text-muted-foreground">{step + 1} / {STEPS.length}</span>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={!canNext() || saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-obsidian-950 border-t-transparent rounded-full animate-spin" /> Saving...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Complete Profile</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
