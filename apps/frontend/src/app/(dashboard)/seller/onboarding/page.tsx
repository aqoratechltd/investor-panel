'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/auth.store'
import {
  User, Building2, BarChart3, FileSpreadsheet, DollarSign,
  ChevronRight, ChevronLeft, CheckCircle2, Upload, X, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const STEPS = [
  { icon: User,            label: 'Personal Info' },
  { icon: Building2,       label: 'Business Details' },
  { icon: BarChart3,       label: 'Financials' },
  { icon: DollarSign,      label: 'Investment Terms' },
  { icon: FileSpreadsheet, label: 'Documents' },
]

const COMPANY_SIZES    = ['1–10', '11–50', '51–200', '201–500', '500+']
const INDUSTRIES       = ['Technology','Real Estate','Healthcare','Finance','Food & Beverage','E-commerce','Education','Manufacturing','Energy','Logistics','Other']
const INVESTMENT_TYPES = ['Equity','Debt','Revenue Share','Convertible Note']
const RISK_LEVELS      = ['Low','Medium','High']

// ── Extracted outside to avoid remount on every keystroke ──────────────────
function NumField({ label, field, prefix = '$', suffix = '', value, onChange, hint }: {
  label: string; field: string; prefix?: string; suffix?: string
  value: string; onChange: (field: string, val: string) => void; hint?: string
}) {
  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{label} *</label>
      <div className="relative">
        {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{prefix}</span>}
        <input
          type="number" min="0" value={value}
          onChange={e => onChange(field, e.target.value)}
          className={cn(
            'w-full bg-obsidian-800 border border-border rounded-xl py-3 text-sm focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20',
            prefix ? 'pl-8' : 'pl-4',
            suffix ? 'pr-12' : 'pr-4',
          )}
          placeholder="0"
        />
        {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">{suffix}</span>}
      </div>
      {hint && <p className="text-xs text-brand-400 mt-1">{hint}</p>}
    </div>
  )
}

function TextField({ label, field, placeholder = '', type = 'text', value, onChange }: {
  label: string; field: string; placeholder?: string; type?: string
  value: string; onChange: (field: string, val: string) => void
}) {
  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{label} *</label>
      <input
        type={type} value={value} onChange={e => onChange(field, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-obsidian-800 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20"
      />
    </div>
  )
}

export default function SellerOnboarding() {
  const router  = useRouter()
  const { user } = useAuthStore()
  const [step, setStep]     = useState(0)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [plFile, setPlFile] = useState<File | null>(null)

  const [form, setForm] = useState({
    // Step 0
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    phone: '',
    // Step 1
    companyName: '', businessDescription: '', industry: '',
    website: '', companySize: '', founded: '', country: 'Pakistan',
    // Step 2
    ttmRevenue: '', ttmProfit: '', lastMonthRevenue: '', lastMonthProfit: '',
    customers: '', annualRecurringRevenue: '', annualGrowthRate: '', churnRate: '',
    // Step 3 — Investment Terms
    askingAmount: '', minInvestment: '', equityOffered: '',
    expectedROI: '', lockPeriod: '', riskLevel: '', investmentType: '', highlights: '',
  })

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const n    = (k: string) => parseFloat(form[k as keyof typeof form]) || 0

  const canNext = () => {
    if (step === 0) return form.fullName.trim() && form.email.trim() && form.phone.trim()
    if (step === 1) return form.companyName.trim() && form.businessDescription.trim() && form.industry && form.companySize && form.founded && form.country
    if (step === 2) return form.ttmRevenue && form.ttmProfit && form.lastMonthRevenue && form.lastMonthProfit && form.customers && form.annualRecurringRevenue && form.annualGrowthRate && form.churnRate
    if (step === 3) return n('askingAmount') > 0 && n('minInvestment') > 0 && n('minInvestment') <= n('askingAmount') && n('equityOffered') > 0 && n('equityOffered') <= 100 && n('expectedROI') > 0 && n('lockPeriod') >= 1 && form.riskLevel && form.investmentType
    return !!plFile
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      toast.error('Please upload an Excel (.xlsx, .xls) or CSV file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB')
      return
    }
    setPlFile(file)
  }

  const handleSubmit = async () => {
    if (!plFile || !user) return
    setSaving(true)
    toast.loading('Submitting your application...', { id: 'seller-app' })
    try {
      const { db, isFirebaseConfigured } = await import('@/lib/firebase')
      if (!isFirebaseConfigured()) throw new Error('Firebase not configured')
      const { doc, setDoc } = await import('firebase/firestore')

      // Upload P&L file to Firebase Storage
      const { storage } = await import('@/lib/firebase')
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
      const storageRef = ref(storage, `pl_statements/${user.id}/${Date.now()}_${plFile.name}`)
      await uploadBytes(storageRef, plFile)
      const plStatementUrl = await getDownloadURL(storageRef)

      const now = new Date()
      const lockedUntil = new Date(now)
      lockedUntil.setMonth(lockedUntil.getMonth() + 1)

      // Direct-to-Market model: seller applications are auto-approved on submission.
      // TO RE-ENABLE: Restore approval gate by setting status: 'PENDING' and routing to /seller/pending
      await setDoc(doc(db, 'seller_applications', user.id), {
        uid: user.id,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        companyName: form.companyName.trim(),
        businessDescription: form.businessDescription.trim(),
        industry: form.industry,
        website: form.website.trim() || null,
        companySize: form.companySize,
        founded: parseInt(form.founded) || null,
        country: form.country,
        // Financials
        ttmRevenue:            n('ttmRevenue'),
        ttmProfit:             n('ttmProfit'),
        lastMonthRevenue:      n('lastMonthRevenue'),
        lastMonthProfit:       n('lastMonthProfit'),
        customers:             parseInt(form.customers) || 0,
        annualRecurringRevenue: n('annualRecurringRevenue'),
        annualGrowthRate:      n('annualGrowthRate'),
        churnRate:             n('churnRate'),
        // Investment Terms
        askingAmount:    n('askingAmount'),
        minInvestment:   n('minInvestment'),
        equityOffered:   n('equityOffered'),
        expectedROI:     n('expectedROI'),
        lockPeriod:      parseInt(form.lockPeriod) || 12,
        riskLevel:       form.riskLevel,
        investmentType:  form.investmentType,
        highlights:      form.highlights.split('\n').map(h => h.trim()).filter(Boolean),
        // Meta
        plStatementUrl,
        plStatementName: plFile.name,
        // Direct-to-Market: auto-approve, no admin review queue
        status: 'APPROVED',
        submittedAt: now.toISOString(),
        reviewedAt: now.toISOString(),
        rejectionReason: null,
      })

      toast.success('Seller profile created! You can now list your business.', { id: 'seller-app' })
      router.push('/seller')
    } catch (err: any) {
      toast.error(err?.message || 'Submission failed. Please try again.', { id: 'seller-app' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center p-4"
      style={{ backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6,182,212,0.06), transparent)' }}>
      <div className="w-full max-w-2xl">

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-4">
            <Building2 className="w-3.5 h-3.5" /> Seller Application — InvestorPanel
          </div>
          <h1 className="text-3xl font-bold font-display mb-2">List your <span className="text-brand-400">business</span></h1>
          <p className="text-muted-foreground text-sm">Complete all fields accurately. Your application will be reviewed within 48 hours.</p>
        </motion.div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <motion.div animate={{ scale: i === step ? 1.05 : 1 }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  i < step  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : i === step ? 'bg-brand-500 text-obsidian-950'
                  : 'bg-obsidian-800 text-muted-foreground border border-border',
                )}>
                {i < step ? <CheckCircle2 className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </motion.div>
              {i < STEPS.length - 1 && <div className={cn('w-5 h-px', i < step ? 'bg-brand-500/50' : 'bg-border')} />}
            </div>
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }} className="glass-card rounded-2xl p-8">

          {/* Step 0 — Personal */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Personal Information</h2>
                  <p className="text-sm text-muted-foreground">Your contact details for our records</p>
                </div>
              </div>
              <TextField label="Full Name"     field="fullName" placeholder="Your full legal name"   value={form.fullName} onChange={setF} />
              <TextField label="Email Address" field="email"    placeholder="you@company.com" type="email" value={form.email} onChange={setF} />
              <TextField label="Phone Number"  field="phone"    placeholder="+92 300 0000000"         value={form.phone} onChange={setF} />
            </div>
          )}

          {/* Step 1 — Business */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Business Details</h2>
                  <p className="text-sm text-muted-foreground">Tell investors about your company</p>
                </div>
              </div>

              <TextField label="Company Name" field="companyName" placeholder="Acme Pvt Ltd" value={form.companyName} onChange={setF} />

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Business Description *</label>
                <textarea value={form.businessDescription} onChange={e => setF('businessDescription', e.target.value)}
                  placeholder="Describe what your business does, your target market, and competitive advantages..."
                  rows={3} className="w-full bg-obsidian-800 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500/50 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Industry *</label>
                  <select value={form.industry} onChange={e => setF('industry', e.target.value)}
                    className="w-full bg-obsidian-800 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500/50">
                    <option value="">Select...</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <TextField label="Founded Year" field="founded" type="number" placeholder="2020" value={form.founded} onChange={setF} />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Company Size *</label>
                <div className="flex gap-2 flex-wrap">
                  {COMPANY_SIZES.map(s => (
                    <button key={s} type="button" onClick={() => setF('companySize', s)}
                      className={cn(
                        'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                        form.companySize === s
                          ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
                          : 'bg-obsidian-800 border-border text-muted-foreground hover:border-brand-500/30',
                      )}>
                      {s} employees
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <TextField label="Country" field="country" placeholder="Pakistan" value={form.country} onChange={setF} />
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Website</label>
                  <input value={form.website} onChange={e => setF('website', e.target.value)}
                    placeholder="https://yourcompany.com"
                    className="w-full bg-obsidian-800 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500/50" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Financials */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Financial Metrics</h2>
                  <p className="text-sm text-muted-foreground">All fields are required. Be accurate — we verify.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">Enter amounts in USD. Inaccurate data will result in immediate rejection.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <NumField label="TTM Revenue"           field="ttmRevenue"             value={form.ttmRevenue}             onChange={setF} />
                <NumField label="TTM Profit"            field="ttmProfit"              value={form.ttmProfit}              onChange={setF} />
                <NumField label="Last Month Revenue"    field="lastMonthRevenue"       value={form.lastMonthRevenue}       onChange={setF} />
                <NumField label="Last Month Profit"     field="lastMonthProfit"        value={form.lastMonthProfit}        onChange={setF} />
                <NumField label="Total Customers"       field="customers"              value={form.customers}              onChange={setF} prefix="" />
                <NumField label="Annual Recurring Rev." field="annualRecurringRevenue" value={form.annualRecurringRevenue} onChange={setF} />
                <NumField label="Annual Growth Rate"    field="annualGrowthRate"       value={form.annualGrowthRate}       onChange={setF} prefix="" suffix="%" />
                <NumField label="Churn Rate"            field="churnRate"              value={form.churnRate}              onChange={setF} prefix="" suffix="%" />
              </div>
            </div>
          )}

          {/* Step 3 — Investment Terms */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Investment Terms</h2>
                  <p className="text-sm text-muted-foreground">Set your marketplace listing details — shown to investors</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <NumField label="Asking Amount" field="askingAmount" value={form.askingAmount} onChange={setF}
                  hint="Total investment you're seeking" />
                <NumField label="Min Investment" field="minInvestment" value={form.minInvestment} onChange={setF}
                  hint="Minimum an investor can commit" />
                <NumField label="Equity Offered" field="equityOffered" value={form.equityOffered} onChange={setF}
                  prefix="" suffix="%" hint="% of company you're offering" />
                <NumField label="Expected ROI" field="expectedROI" value={form.expectedROI} onChange={setF}
                  prefix="" suffix="%" hint="Projected annual return" />
                <NumField label="Lock Period (months)" field="lockPeriod" value={form.lockPeriod} onChange={setF}
                  prefix="" hint="How long funds stay locked" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Risk Level *</label>
                  <div className="flex gap-2">
                    {RISK_LEVELS.map(r => (
                      <button key={r} type="button" onClick={() => setF('riskLevel', r)}
                        className={cn(
                          'flex-1 py-2 rounded-xl text-sm font-medium border transition-all',
                          form.riskLevel === r
                            ? r === 'Low' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                              : r === 'Medium' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                              : 'bg-red-500/20 border-red-500/50 text-red-300'
                            : 'bg-obsidian-800 border-border text-muted-foreground hover:border-brand-500/30',
                        )}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Investment Type *</label>
                  <select value={form.investmentType} onChange={e => setF('investmentType', e.target.value)}
                    className="w-full bg-obsidian-800 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500/50">
                    <option value="">Select...</option>
                    {INVESTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Key Highlights <span className="text-muted-foreground/60">(optional, one per line)</span></label>
                <textarea value={form.highlights} onChange={e => setF('highlights', e.target.value)}
                  placeholder={'Profitable since 2022\n40% YoY growth\nPatented technology'}
                  rows={3} className="w-full bg-obsidian-800 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500/50 resize-none" />
              </div>

              {n('minInvestment') > n('askingAmount') && n('askingAmount') > 0 && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Min investment cannot exceed asking amount
                </p>
              )}
            </div>
          )}

          {/* Step 4 — Documents */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">P&L Statement</h2>
                  <p className="text-sm text-muted-foreground">Upload your Profit & Loss statement</p>
                </div>
              </div>

              <div onClick={() => fileRef.current?.click()}
                className={cn(
                  'relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
                  plFile ? 'border-violet-500/50 bg-violet-500/5' : 'border-border hover:border-violet-500/40 hover:bg-violet-500/5',
                )}>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
                {plFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                      <FileSpreadsheet className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{plFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{(plFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button type="button" onClick={e => { e.stopPropagation(); setPlFile(null) }}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300">
                      <X className="w-3 h-3" /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-10 h-10 text-muted-foreground/40" />
                    <div>
                      <p className="font-semibold text-sm">Click to upload P&L Statement</p>
                      <p className="text-xs text-muted-foreground mt-1">Excel (.xlsx, .xls) or CSV — max 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-brand-500/8 border border-brand-500/20">
                <p className="text-xs text-brand-300">
                  <span className="font-semibold">Lock period:</span> Once submitted, you cannot edit this application for 30 days.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-xs text-muted-foreground">{step + 1} / {STEPS.length}</span>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-obsidian-950 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={!canNext() || saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-obsidian-950 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {saving
                ? <><div className="w-4 h-4 border-2 border-obsidian-950 border-t-transparent rounded-full animate-spin" /> Submitting...</>
                : <><CheckCircle2 className="w-4 h-4" /> Submit Application</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
