'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuthStore } from '@/stores/auth.store'
import {
  Building2, BarChart3, DollarSign,
  ChevronRight, ChevronLeft, CheckCircle2, AlertCircle,
  TrendingUp, TrendingDown, Info, Sparkles, TriangleAlert,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const STEPS = [
  { icon: Building2,  label: 'Business Info' },
  { icon: BarChart3,  label: 'Financials' },
  { icon: DollarSign, label: 'Investment Terms' },
]
const CATEGORIES      = ['Technology','Real Estate','Healthcare','Finance','Food & Beverage','E-commerce','Education','Manufacturing','Energy','Logistics','Other']
const INVESTMENT_TYPES = ['Equity','Debt','Revenue Share','Convertible Note']
const RISK_LEVELS     = ['Low','Medium','High']
const COMPANY_SIZES   = ['1–10','11–50','51–200','201–500','500+']

const CURRENT_YEAR = new Date().getFullYear()

// ─── Field components (outside to avoid remount) ──────────────────────────────
function Field({ label, value, onChange, type = 'text', placeholder = '', required = true, error }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; required?: boolean; error?: string
}) {
  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full bg-obsidian-800 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-colors',
          error
            ? 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/20'
            : 'border-border focus:border-brand-500/50 focus:ring-brand-500/20',
        )}
      />
      {error && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  )
}

function NumField({ label, value, onChange, prefix = '$', suffix = '', error, hint }: {
  label: string; value: string; onChange: (v: string) => void
  prefix?: string; suffix?: string; error?: string; hint?: string
}) {
  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
        {label} <span className="text-red-400">*</span>
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{prefix}</span>}
        <input
          type="number" min="0" value={value} onChange={e => onChange(e.target.value)}
          placeholder="0"
          className={cn(
            'w-full bg-obsidian-800 border rounded-xl py-3 text-sm focus:outline-none focus:ring-1 transition-colors',
            prefix ? 'pl-8' : 'pl-4',
            suffix ? 'pr-14' : 'pr-4',
            error
              ? 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/20'
              : 'border-border focus:border-brand-500/50 focus:ring-brand-500/20',
          )}
        />
        {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">{suffix}</span>}
      </div>
      {error && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
      {hint && !error && <p className="text-xs text-brand-400 mt-1 flex items-center gap-1"><Sparkles className="w-3 h-3" />{hint}</p>}
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

function fmtNum(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export default function CreateBusinessPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [step, setStep]     = useState(0)
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const [form, setForm] = useState({
    name: '', tagline: '', description: '', category: '', industry: '',
    companySize: '', founded: '', country: 'Pakistan', website: '',
    ttmRevenue: '', ttmProfit: '', lastMonthRevenue: '', lastMonthProfit: '',
    customers: '', annualRecurringRevenue: '', annualGrowthRate: '', churnRate: '',
    askingAmount: '', minInvestment: '', equityOffered: '', expectedROI: '',
    lockPeriod: '', riskLevel: '', investmentType: '', highlights: '',
  })

  const setF = (k: string) => (v: string) => {
    setForm(p => ({ ...p, [k]: v }))
    setTouched(p => ({ ...p, [k]: true }))
  }

  const n = (k: string) => parseFloat(form[k as keyof typeof form]) || 0

  // ── Derived / auto-calculated metrics ─────────────────────────────────────
  const derived = useMemo(() => {
    const rev   = n('ttmRevenue')
    const prof  = n('ttmProfit')
    const ask   = n('askingAmount')
    const eq    = n('equityOffered')
    const lmRev = n('lastMonthRevenue')
    const lmProf= n('lastMonthProfit')

    const profitMargin      = rev > 0 ? (prof / rev) * 100 : null
    const lmProfitMargin    = lmRev > 0 ? (lmProf / lmRev) * 100 : null
    const revenuePerCustomer= n('customers') > 0 ? rev / n('customers') : null
    const impliedValuation  = eq > 0 ? (ask / eq) * 100 : null
    // Auto ROI suggestion: (equity% of annual profit) / investment * 100 annualised
    const suggestedROI      = ask > 0 && prof > 0 && eq > 0
      ? ((prof * eq / 100) / ask) * 100
      : null

    return { profitMargin, lmProfitMargin, revenuePerCustomer, impliedValuation, suggestedROI }
  }, [form])

  // ── Validation ────────────────────────────────────────────────────────────
  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    const yr = CURRENT_YEAR

    // Step 0
    if (touched.name && !form.name.trim()) e.name = 'Business name is required'
    if (touched.name && form.name.trim().length < 3) e.name = 'Must be at least 3 characters'
    if (touched.description && form.description.trim().length < 50)
      e.description = `Too short — add more detail (${form.description.trim().length}/50 chars min)`
    if (touched.founded) {
      const yr_ = parseInt(form.founded)
      if (!form.founded || isNaN(yr_)) e.founded = 'Enter a valid year'
      else if (yr_ < 1900 || yr_ > yr) e.founded = `Must be between 1900 and ${yr}`
    }
    if (touched.website && form.website && !/^https?:\/\/.+/.test(form.website))
      e.website = 'Must start with http:// or https://'

    // Step 1
    if (touched.ttmRevenue && n('ttmRevenue') <= 0) e.ttmRevenue = 'Revenue must be greater than 0'
    if (touched.ttmProfit && n('ttmProfit') > n('ttmRevenue') && n('ttmRevenue') > 0)
      e.ttmProfit = 'Profit cannot exceed revenue'
    if (touched.lastMonthRevenue && n('lastMonthRevenue') <= 0) e.lastMonthRevenue = 'Required'
    if (touched.lastMonthProfit && n('lastMonthProfit') > n('lastMonthRevenue') && n('lastMonthRevenue') > 0)
      e.lastMonthProfit = 'Profit cannot exceed revenue'
    if (touched.customers && n('customers') < 1) e.customers = 'Must have at least 1 customer'
    if (touched.annualGrowthRate) {
      const g = n('annualGrowthRate')
      if (g < 0) e.annualGrowthRate = 'Cannot be negative'
      if (g > 1000) e.annualGrowthRate = 'Seems unrealistic (>1000%)'
    }
    if (touched.churnRate) {
      const c = n('churnRate')
      if (c < 0 || c > 100) e.churnRate = 'Must be between 0–100%'
    }

    // Step 2
    if (touched.askingAmount && n('askingAmount') <= 0) e.askingAmount = 'Asking amount must be greater than 0'
    if (touched.minInvestment) {
      if (n('minInvestment') <= 0) e.minInvestment = 'Minimum investment must be greater than 0'
      if (n('minInvestment') > n('askingAmount') && n('askingAmount') > 0)
        e.minInvestment = 'Cannot exceed asking amount'
    }
    if (touched.equityOffered) {
      const eq = n('equityOffered')
      if (eq <= 0 || eq > 100) e.equityOffered = 'Must be between 0.1–100%'
    }
    if (touched.expectedROI) {
      const roi = n('expectedROI')
      if (roi <= 0) e.expectedROI = 'ROI must be positive'
      if (roi > 500) e.expectedROI = 'ROI over 500% will raise red flags with investors'
    }
    if (touched.lockPeriod) {
      const lp = n('lockPeriod')
      if (lp < 1) e.lockPeriod = 'Minimum 1 month'
      if (lp > 120) e.lockPeriod = 'Maximum 120 months (10 years)'
    }

    return e
  }, [form, touched])

  // ── Step validity ─────────────────────────────────────────────────────────
  const stepValid = [
    // Step 0
    form.name.trim().length >= 3 && form.description.trim().length >= 50 &&
    form.category && form.industry.trim() && form.companySize &&
    form.founded && parseInt(form.founded) >= 1900 && parseInt(form.founded) <= CURRENT_YEAR &&
    form.country &&
    (!form.website || /^https?:\/\/.+/.test(form.website)),
    // Step 1
    n('ttmRevenue') > 0 && n('ttmProfit') <= n('ttmRevenue') &&
    n('lastMonthRevenue') > 0 && n('lastMonthProfit') <= n('lastMonthRevenue') &&
    n('customers') >= 1 &&
    n('annualGrowthRate') >= 0 && n('annualGrowthRate') <= 1000 &&
    n('churnRate') >= 0 && n('churnRate') <= 100 &&
    form.annualRecurringRevenue,
    // Step 2
    n('askingAmount') > 0 && n('minInvestment') > 0 && n('minInvestment') <= n('askingAmount') &&
    n('equityOffered') > 0 && n('equityOffered') <= 100 &&
    n('expectedROI') > 0 && n('lockPeriod') >= 1 &&
    form.riskLevel && form.investmentType,
  ]

  // Touch all fields in current step so errors show on Next click
  const touchStep = (s: number) => {
    const stepFields: Record<number, string[]> = {
      0: ['name','description','category','industry','companySize','founded','country','website'],
      1: ['ttmRevenue','ttmProfit','lastMonthRevenue','lastMonthProfit','customers','annualRecurringRevenue','annualGrowthRate','churnRate'],
      2: ['askingAmount','minInvestment','equityOffered','expectedROI','lockPeriod','riskLevel','investmentType'],
    }
    const upd: Record<string, boolean> = {}
    stepFields[s]?.forEach(k => { upd[k] = true })
    setTouched(p => ({ ...p, ...upd }))
  }

  const handleNext = () => {
    touchStep(step)
    if (stepValid[step]) setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    touchStep(2)
    if (!stepValid[2] || !user) return
    setSaving(true)
    toast.loading('Submitting business for review…', { id: 'biz' })
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
      await addDoc(collection(db, 'businesses'), {
        sellerId: user.id, sellerName: `${user.firstName} ${user.lastName}`, sellerEmail: user.email,
        name: form.name.trim(), tagline: form.tagline.trim(), description: form.description.trim(),
        category: form.category, industry: form.industry.trim(), companySize: form.companySize,
        founded: parseInt(form.founded) || null, country: form.country, website: form.website.trim() || null,
        ttmRevenue: n('ttmRevenue'), ttmProfit: n('ttmProfit'),
        lastMonthRevenue: n('lastMonthRevenue'), lastMonthProfit: n('lastMonthProfit'),
        customers: parseInt(form.customers) || 0, annualRecurringRevenue: n('annualRecurringRevenue'),
        annualGrowthRate: n('annualGrowthRate'), churnRate: n('churnRate'),
        askingAmount: n('askingAmount'), minInvestment: n('minInvestment'),
        equityOffered: n('equityOffered'), expectedROI: n('expectedROI'),
        lockPeriod: parseInt(form.lockPeriod) || 0, riskLevel: form.riskLevel, investmentType: form.investmentType,
        highlights: form.highlights.split('\n').map(h => h.trim()).filter(Boolean),
        status: 'DRAFT', viewCount: 0, interestedCount: 0,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(), reviewedAt: null, rejectionReason: null,
      })
      toast.success('Business submitted! Admin will review within 48h.', { id: 'biz' })
      router.push('/seller/businesses')
    } catch (err: any) {
      toast.error(err?.message || 'Submission failed', { id: 'biz' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout role="SELLER">
      <div className="p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold font-display">List a New Business</h1>
            <p className="text-sm text-muted-foreground mt-1">Reviewed by our admin team before going live.</p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <motion.div animate={{ scale: i === step ? 1.05 : 1 }}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all w-full justify-center',
                    i < step ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                    : i === step ? 'bg-brand-500 text-obsidian-950'
                    : 'bg-obsidian-800 text-muted-foreground border border-border',
                  )}>
                  {i < step ? <CheckCircle2 className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </motion.div>
                {i < STEPS.length - 1 && <div className={cn('w-6 h-px flex-shrink-0', i < step ? 'bg-brand-500/50' : 'bg-border')} />}
              </div>
            ))}
          </div>

          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }} className="glass-card rounded-2xl p-8 space-y-5">

            {/* ── Step 0 — Business Info ── */}
            {step === 0 && <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center"><Building2 className="w-5 h-5 text-brand-400" /></div>
                <div><h2 className="font-semibold text-lg">Business Information</h2><p className="text-xs text-muted-foreground">Tell investors about your company</p></div>
              </div>

              <Field label="Business Name" value={form.name} onChange={setF('name')} placeholder="Acme Technologies" error={errors.name} />
              <Field label="Tagline" value={form.tagline} onChange={setF('tagline')} placeholder="One-line pitch for investors" required={false} />

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Description <span className="text-red-400">*</span>
                  <span className={cn('ml-2 text-xs font-normal', form.description.trim().length >= 50 ? 'text-emerald-400' : 'text-muted-foreground')}>
                    {form.description.trim().length}/50 min
                  </span>
                </label>
                <textarea value={form.description} onChange={e => setF('description')(e.target.value)}
                  placeholder="Describe your business, target market, and competitive advantages…" rows={4}
                  className={cn(
                    'w-full bg-obsidian-800 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 resize-none transition-colors',
                    errors.description ? 'border-red-500/60 focus:ring-red-500/20' : 'border-border focus:border-brand-500/50 focus:ring-brand-500/20',
                  )} />
                {errors.description && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Category <span className="text-red-400">*</span></label>
                  <select value={form.category} onChange={e => setF('category')(e.target.value)}
                    className="w-full bg-obsidian-800 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500/50">
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <Field label="Industry" value={form.industry} onChange={setF('industry')} placeholder="SaaS, Fintech…" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Founded Year" value={form.founded} onChange={setF('founded')} type="number"
                  placeholder={String(CURRENT_YEAR - 5)} error={errors.founded} />
                <Field label="Country" value={form.country} onChange={setF('country')} placeholder="Pakistan" />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Company Size <span className="text-red-400">*</span></label>
                <div className="flex gap-2 flex-wrap">
                  {COMPANY_SIZES.map(s => (
                    <button key={s} type="button" onClick={() => setF('companySize')(s)}
                      className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                        form.companySize === s ? 'bg-brand-500/20 border-brand-500/50 text-brand-300' : 'bg-obsidian-800 border-border text-muted-foreground hover:border-brand-500/30')}>
                      {s} employees
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Website" value={form.website} onChange={setF('website')} placeholder="https://yourcompany.com" required={false} error={errors.website} />
            </>}

            {/* ── Step 1 — Financials ── */}
            {step === 1 && <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-emerald-400" /></div>
                <div><h2 className="font-semibold text-lg">Financial Metrics</h2><p className="text-xs text-muted-foreground">All figures in USD — we verify accuracy.</p></div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">Inaccurate data will result in rejection. Numbers are cross-checked with your P&L.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <NumField label="TTM Revenue" value={form.ttmRevenue} onChange={setF('ttmRevenue')} error={errors.ttmRevenue} />
                <NumField label="TTM Profit" value={form.ttmProfit} onChange={setF('ttmProfit')} error={errors.ttmProfit}
                  hint={derived.profitMargin !== null ? `Profit margin: ${derived.profitMargin.toFixed(1)}%` : undefined} />
                <NumField label="Last Month Revenue" value={form.lastMonthRevenue} onChange={setF('lastMonthRevenue')} error={errors.lastMonthRevenue} />
                <NumField label="Last Month Profit" value={form.lastMonthProfit} onChange={setF('lastMonthProfit')} error={errors.lastMonthProfit}
                  hint={derived.lmProfitMargin !== null ? `Margin: ${derived.lmProfitMargin.toFixed(1)}%` : undefined} />
                <NumField label="Total Customers" value={form.customers} onChange={setF('customers')} prefix="" error={errors.customers}
                  hint={derived.revenuePerCustomer !== null ? `Rev/customer: ${fmtNum(derived.revenuePerCustomer)}` : undefined} />
                <NumField label="Annual Recurring Rev." value={form.annualRecurringRevenue} onChange={setF('annualRecurringRevenue')} />
                <NumField label="Annual Growth Rate" value={form.annualGrowthRate} onChange={setF('annualGrowthRate')} prefix="" suffix="%" error={errors.annualGrowthRate} />
                <NumField label="Churn Rate" value={form.churnRate} onChange={setF('churnRate')} prefix="" suffix="%" error={errors.churnRate} />
              </div>

              {/* Live financial health panel */}
              {(n('ttmRevenue') > 0 || n('ttmProfit') !== 0) && (
                <div className="mt-2 p-4 rounded-xl bg-obsidian-900/60 border border-border space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-brand-400" /> Auto-calculated insights
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {derived.profitMargin !== null && (
                      <div className="flex items-center gap-2">
                        {derived.profitMargin >= 20
                          ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          : derived.profitMargin >= 0
                          ? <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                          : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                        <span className="text-xs text-muted-foreground">
                          Profit margin: <span className={cn('font-semibold', derived.profitMargin >= 20 ? 'text-emerald-400' : derived.profitMargin >= 0 ? 'text-amber-400' : 'text-red-400')}>
                            {derived.profitMargin.toFixed(1)}%
                          </span>
                        </span>
                      </div>
                    )}
                    {derived.revenuePerCustomer !== null && (
                      <div className="flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 text-brand-400" />
                        <span className="text-xs text-muted-foreground">
                          Rev/customer: <span className="font-semibold text-brand-400">{fmtNum(derived.revenuePerCustomer)}</span>
                        </span>
                      </div>
                    )}
                    {n('annualGrowthRate') > 0 && n('churnRate') > 0 && (
                      <div className="flex items-center gap-2 col-span-2">
                        {n('annualGrowthRate') > n('churnRate')
                          ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          : <TriangleAlert className="w-3.5 h-3.5 text-red-400" />}
                        <span className="text-xs text-muted-foreground">
                          Net growth: <span className={cn('font-semibold', n('annualGrowthRate') > n('churnRate') ? 'text-emerald-400' : 'text-red-400')}>
                            {(n('annualGrowthRate') - n('churnRate')).toFixed(1)}%
                          </span>
                          {n('annualGrowthRate') <= n('churnRate') && <span className="text-red-400 ml-1">— churn exceeds growth</span>}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>}

            {/* ── Step 2 — Investment Terms ── */}
            {step === 2 && <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center"><DollarSign className="w-5 h-5 text-violet-400" /></div>
                <div><h2 className="font-semibold text-lg">Investment Terms</h2><p className="text-xs text-muted-foreground">Define what you're offering investors</p></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <NumField label="Asking Amount" value={form.askingAmount} onChange={setF('askingAmount')} error={errors.askingAmount}
                  hint={derived.impliedValuation !== null ? `Implied valuation: ${fmtNum(derived.impliedValuation)}` : undefined} />
                <NumField label="Min Investment" value={form.minInvestment} onChange={setF('minInvestment')} error={errors.minInvestment} />
                <NumField label="Equity Offered" value={form.equityOffered} onChange={setF('equityOffered')} prefix="" suffix="%" error={errors.equityOffered}
                  hint={derived.impliedValuation !== null ? `Valuation: ${fmtNum(derived.impliedValuation)}` : undefined} />
                <NumField label="Expected ROI" value={form.expectedROI} onChange={setF('expectedROI')} prefix="" suffix="%" error={errors.expectedROI}
                  hint={derived.suggestedROI !== null ? `Suggested based on financials: ${derived.suggestedROI.toFixed(1)}%` : undefined} />
                <NumField label="Lock Period" value={form.lockPeriod} onChange={setF('lockPeriod')} prefix="" suffix="months" error={errors.lockPeriod} />
              </div>

              {/* ROI auto-fill suggestion */}
              {derived.suggestedROI !== null && !form.expectedROI && (
                <button type="button"
                  onClick={() => setF('expectedROI')(derived.suggestedROI!.toFixed(1))}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-brand-500/30 bg-brand-500/5 text-brand-400 text-xs font-medium hover:bg-brand-500/10 transition-all">
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-fill suggested ROI: {derived.suggestedROI.toFixed(1)}%
                </button>
              )}

              {/* Implied valuation callout */}
              {derived.impliedValuation !== null && n('ttmRevenue') > 0 && (
                <div className="p-4 rounded-xl bg-obsidian-900/60 border border-border space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-brand-400" /> Deal analysis
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Implied Valuation</p>
                      <p className="text-sm font-bold font-mono text-violet-400">{fmtNum(derived.impliedValuation)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Revenue Multiple</p>
                      <p className="text-sm font-bold font-mono text-brand-400">
                        {n('ttmRevenue') > 0 ? `${(derived.impliedValuation / n('ttmRevenue')).toFixed(1)}x` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Profit Multiple</p>
                      <p className="text-sm font-bold font-mono text-emerald-400">
                        {n('ttmProfit') > 0 ? `${(derived.impliedValuation / n('ttmProfit')).toFixed(1)}x` : '—'}
                      </p>
                    </div>
                  </div>
                  {n('ttmRevenue') > 0 && derived.impliedValuation / n('ttmRevenue') > 20 && (
                    <p className="text-xs text-amber-400 flex items-center gap-1">
                      <TriangleAlert className="w-3 h-3" /> High revenue multiple — investors may negotiate valuation down.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Investment Type <span className="text-red-400">*</span></label>
                  <select value={form.investmentType} onChange={e => setF('investmentType')(e.target.value)}
                    className="w-full bg-obsidian-800 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500/50">
                    <option value="">Select…</option>
                    {INVESTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Risk Level <span className="text-red-400">*</span></label>
                  <div className="flex gap-2 mt-1">
                    {RISK_LEVELS.map(r => (
                      <button key={r} type="button" onClick={() => setF('riskLevel')(r)}
                        className={cn('flex-1 py-2 rounded-xl text-xs font-semibold border transition-all',
                          form.riskLevel === r
                            ? r === 'Low' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : r === 'Medium' ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                              : 'bg-red-500/20 border-red-500/40 text-red-300'
                            : 'bg-obsidian-800 border-border text-muted-foreground hover:border-white/20')}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Key Highlights <span className="text-xs font-normal text-muted-foreground/60">(one per line, optional)</span>
                </label>
                <textarea value={form.highlights} onChange={e => setF('highlights')(e.target.value)}
                  placeholder={"Profitable for 3 years\n40% YoY growth\nPatent-protected technology"} rows={4}
                  className="w-full bg-obsidian-800 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500/50 resize-none font-mono" />
              </div>
            </>}
          </motion.div>

          <div className="flex items-center justify-between mt-6">
            <button onClick={() => step === 0 ? router.back() : setStep(s => s - 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-xs text-muted-foreground">{step + 1} / {STEPS.length}</span>
            {step < STEPS.length - 1 ? (
              <button onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-obsidian-950 text-sm font-semibold transition-all">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-obsidian-950 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {saving ? <><div className="w-4 h-4 border-2 border-obsidian-950 border-t-transparent rounded-full animate-spin" /> Submitting…</> : <><CheckCircle2 className="w-4 h-4" /> Submit for Review</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
