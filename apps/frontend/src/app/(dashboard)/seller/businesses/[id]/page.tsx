'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuthStore } from '@/stores/auth.store'
import {
  ArrowLeft, Building2, Save, Loader2, TrendingUp, TrendingDown,
  DollarSign, BarChart3, Users, Globe, EyeOff, CheckCircle2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface BusinessForm {
  name: string
  description: string
  tagline: string
  category: string
  industry: string
  website: string
  companySize: string
  founded: string
  country: string
  ttmRevenue: number
  ttmProfit: number
  lastMonthRevenue: number
  lastMonthProfit: number
  customers: number
  annualRecurringRevenue: number
  annualGrowthRate: number
  churnRate: number
  askingAmount: number
  minInvestment: number
  equityOffered: number
  expectedROI: number
  lockPeriod: number
  riskLevel: string
  investmentType: string
  highlights: string
}

const RISK_LEVELS = ['Low', 'Medium', 'High']
const INVESTMENT_TYPES = ['Equity', 'Debt', 'Revenue Share', 'Convertible Note']

function Field({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition-all"
      />
    </div>
  )
}

function NumField({ label, value, onChange, placeholder = '0', prefix = '$' }: {
  label: string; value: number; onChange: (v: number) => void
  placeholder?: string; prefix?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span>
        )}
        <input
          type="number"
          value={value || ''}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          placeholder={placeholder}
          className={cn(
            'w-full bg-white/5 border border-white/10 rounded-xl py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition-all',
            prefix ? 'pl-8 pr-4' : 'px-4',
          )}
        />
      </div>
    </div>
  )
}

export default function BusinessEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { user } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [graphLoading, setGraphLoading] = useState<'UP' | 'DOWN' | null>(null)
  const [graphMagnitude, setGraphMagnitude] = useState<number>(5)
  const [hasInvestors, setHasInvestors] = useState(false)
  const [businessStatus, setBusinessStatus] = useState<'PUBLISHED' | 'DRAFT'>('DRAFT')

  const [form, setForm] = useState<BusinessForm>({
    name: '', description: '', tagline: '', category: '', industry: '',
    website: '', companySize: '', founded: '', country: '',
    ttmRevenue: 0, ttmProfit: 0, lastMonthRevenue: 0, lastMonthProfit: 0,
    customers: 0, annualRecurringRevenue: 0, annualGrowthRate: 0, churnRate: 0,
    askingAmount: 0, minInvestment: 0, equityOffered: 0, expectedROI: 0,
    lockPeriod: 12, riskLevel: 'Medium', investmentType: 'Equity', highlights: '',
  })

  const set = useCallback(<K extends keyof BusinessForm>(key: K, value: BusinessForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])

  useEffect(() => {
    if (!user?.id || !id) return
    const load = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { doc, getDoc, collection, query, where, getDocs } = await import('firebase/firestore')

        const snap = await getDoc(doc(db, 'businesses', id))
        if (!snap.exists()) { toast.error('Business not found'); router.back(); return }
        const data = snap.data()

        if (data.sellerId !== user.id) { toast.error('Access denied'); router.back(); return }

        setBusinessStatus(data.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT')
        setForm({
          name: data.name || '',
          description: data.description || '',
          tagline: data.tagline || '',
          category: data.category || '',
          industry: data.industry || '',
          website: data.website || '',
          companySize: data.companySize || '',
          founded: data.founded || '',
          country: data.country || '',
          ttmRevenue: data.ttmRevenue || 0,
          ttmProfit: data.ttmProfit || 0,
          lastMonthRevenue: data.lastMonthRevenue || 0,
          lastMonthProfit: data.lastMonthProfit || 0,
          customers: data.customers || 0,
          annualRecurringRevenue: data.annualRecurringRevenue || 0,
          annualGrowthRate: data.annualGrowthRate || 0,
          churnRate: data.churnRate || 0,
          askingAmount: data.askingAmount || 0,
          minInvestment: data.minInvestment || 0,
          equityOffered: data.equityOffered || 0,
          expectedROI: data.expectedROI || 0,
          lockPeriod: data.lockPeriod || 12,
          riskLevel: data.riskLevel || 'Medium',
          investmentType: data.investmentType || 'Equity',
          highlights: Array.isArray(data.highlights) ? data.highlights.join('\n') : (data.highlights || ''),
        })

        const invQ = query(
          collection(db, 'investments'),
          where('businessId', '==', id),
          where('status', '==', 'APPROVED'),
        )
        const invSnap = await getDocs(invQ)
        setHasInvestors(!invSnap.empty)
      } catch (e) {
        console.error(e)
        toast.error('Failed to load business')
      }
      setLoading(false)
    }
    load()
  }, [user?.id, id])

  const handleSave = async () => {
    if (!user) return
    if (form.askingAmount <= 0) { toast.error('Asking amount is required'); return }
    if (form.minInvestment <= 0) { toast.error('Min investment is required'); return }
    if (form.minInvestment > form.askingAmount) { toast.error('Min investment cannot exceed asking amount'); return }

    setSaving(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc } = await import('firebase/firestore')
      const highlights = form.highlights
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)

      await updateDoc(doc(db, 'businesses', id), {
        name: form.name,
        description: form.description,
        tagline: form.tagline,
        category: form.category,
        industry: form.industry,
        website: form.website,
        companySize: form.companySize,
        founded: form.founded,
        country: form.country,
        ttmRevenue: form.ttmRevenue,
        ttmProfit: form.ttmProfit,
        lastMonthRevenue: form.lastMonthRevenue,
        lastMonthProfit: form.lastMonthProfit,
        customers: form.customers,
        annualRecurringRevenue: form.annualRecurringRevenue,
        annualGrowthRate: form.annualGrowthRate,
        churnRate: form.churnRate,
        askingAmount: form.askingAmount,
        minInvestment: form.minInvestment,
        equityOffered: form.equityOffered,
        expectedROI: form.expectedROI,
        lockPeriod: form.lockPeriod,
        riskLevel: form.riskLevel,
        investmentType: form.investmentType,
        highlights,
        updatedAt: new Date().toISOString(),
      })
      toast.success('Business updated successfully')
    } catch (e) {
      console.error(e)
      toast.error('Failed to save changes')
    }
    setSaving(false)
  }

  const handleTogglePublish = async () => {
    if (!user) return
    setPublishing(true)
    const newStatus = businessStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc } = await import('firebase/firestore')
      await updateDoc(doc(db, 'businesses', id), { status: newStatus, updatedAt: new Date().toISOString() })
      setBusinessStatus(newStatus)
      toast.success(newStatus === 'PUBLISHED' ? 'Business is now live on the marketplace' : 'Business moved to draft')
    } catch (e) {
      console.error(e)
      toast.error('Failed to update status')
    }
    setPublishing(false)
  }

  const handleGraphControl = async (direction: 'UP' | 'DOWN') => {
    if (!user) return
    if (graphMagnitude <= 0 || graphMagnitude > 100) {
      toast.error('Magnitude must be between 1 and 100')
      return
    }
    setGraphLoading(direction)
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc, collection, addDoc, serverTimestamp } = await import('firebase/firestore')

      // Apply directly to the business document
      await updateDoc(doc(db, 'businesses', id), {
        chartDirection: direction,
        chartMagnitude: graphMagnitude,
        chartUpdatedAt: new Date().toISOString(),
      })

      // Log the action for history
      await addDoc(collection(db, 'graph_updates'), {
        businessId:   id,
        businessName: form.name,
        sellerId:     user.id,
        sellerName:   `${user.firstName} ${user.lastName}`,
        direction,
        magnitude:    graphMagnitude,
        appliedAt:    serverTimestamp(),
      })

      toast.success(`Chart pushed ${direction === 'UP' ? 'up' : 'down'} by ${graphMagnitude}%`)
    } catch (e) {
      console.error(e)
      toast.error('Failed to update chart')
    }
    setGraphLoading(null)
  }

  if (loading) {
    return (
      <DashboardLayout role="SELLER">
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  const isPublished = businessStatus === 'PUBLISHED'

  return (
    <DashboardLayout role="SELLER">
      <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold font-display">Edit Business</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{form.name || 'Loading...'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Publish / Unpublish toggle */}
            <button
              onClick={handleTogglePublish}
              disabled={publishing}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border transition-all disabled:opacity-50',
                isPublished
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
              )}
            >
              {publishing
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : isPublished ? <EyeOff className="w-4 h-4" /> : <Globe className="w-4 h-4" />
              }
              {isPublished ? 'Unpublish' : 'Publish'}
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-obsidian-950 text-sm font-semibold transition-all disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>

        {/* Status notice */}
        {isPublished && hasInvestors && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Live with active investors. Use the chart controls below to adjust performance direction.</span>
          </div>
        )}

        {/* Graph Controls — shown when published and has investors */}
        {isPublished && hasInvestors && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 text-sm font-semibold mb-4">
              <BarChart3 className="w-4 h-4 text-brand-400" />
              Chart Controls
            </div>
            <div className="flex items-end gap-4 flex-wrap">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Magnitude (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={graphMagnitude}
                    onChange={e => setGraphMagnitude(Math.min(100, Math.max(1, parseFloat(e.target.value) || 1)))}
                    className="w-28 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <button
                onClick={() => handleGraphControl('UP')}
                disabled={graphLoading !== null}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm border border-emerald-500/20 transition-all disabled:opacity-50"
              >
                {graphLoading === 'UP' ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                Push Up {graphMagnitude}%
              </button>
              <button
                onClick={() => handleGraphControl('DOWN')}
                disabled={graphLoading !== null}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm border border-red-500/20 transition-all disabled:opacity-50"
              >
                {graphLoading === 'DOWN' ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingDown className="w-4 h-4" />}
                Push Down {graphMagnitude}%
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid gap-6">
          {/* Business Info */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
              <Building2 className="w-4 h-4 text-brand-400" />
              Business Information
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Business Name" value={form.name} onChange={v => set('name', v)} />
              <Field label="Tagline" value={form.tagline} onChange={v => set('tagline', v)} placeholder="Short catchy line" />
              <Field label="Category" value={form.category} onChange={v => set('category', v)} placeholder="e.g. SaaS, E-commerce" />
              <Field label="Industry" value={form.industry} onChange={v => set('industry', v)} />
              <Field label="Company Size" value={form.companySize} onChange={v => set('companySize', v)} placeholder="e.g. 1-10" />
              <Field label="Founded" value={form.founded} onChange={v => set('founded', v)} placeholder="e.g. 2020" />
              <Field label="Country" value={form.country} onChange={v => set('country', v)} />
              <Field label="Website" value={form.website} onChange={v => set('website', v)} placeholder="https://" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition-all resize-none"
                placeholder="Describe your business..."
              />
            </div>
          </motion.div>

          {/* Financials */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
              <BarChart3 className="w-4 h-4 text-brand-400" />
              Financials
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumField label="TTM Revenue" value={form.ttmRevenue} onChange={v => set('ttmRevenue', v)} />
              <NumField label="TTM Profit" value={form.ttmProfit} onChange={v => set('ttmProfit', v)} />
              <NumField label="Last Month Revenue" value={form.lastMonthRevenue} onChange={v => set('lastMonthRevenue', v)} />
              <NumField label="Last Month Profit" value={form.lastMonthProfit} onChange={v => set('lastMonthProfit', v)} />
              <NumField label="Annual Recurring Revenue" value={form.annualRecurringRevenue} onChange={v => set('annualRecurringRevenue', v)} />
              <NumField label="Customers" value={form.customers} onChange={v => set('customers', v)} prefix="#" />
              <NumField label="Annual Growth Rate (%)" value={form.annualGrowthRate} onChange={v => set('annualGrowthRate', v)} prefix="%" />
              <NumField label="Churn Rate (%)" value={form.churnRate} onChange={v => set('churnRate', v)} prefix="%" />
            </div>
          </motion.div>

          {/* Investment Terms */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
              <DollarSign className="w-4 h-4 text-brand-400" />
              Investment Terms
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumField label="Asking Amount ($)" value={form.askingAmount} onChange={v => set('askingAmount', v)} />
              <NumField label="Minimum Investment ($)" value={form.minInvestment} onChange={v => set('minInvestment', v)} />
              <NumField label="Equity Offered (%)" value={form.equityOffered} onChange={v => set('equityOffered', v)} prefix="%" />
              <NumField label="Expected ROI (%)" value={form.expectedROI} onChange={v => set('expectedROI', v)} prefix="%" />
              <NumField label="Lock Period (months)" value={form.lockPeriod} onChange={v => set('lockPeriod', v)} prefix="" placeholder="12" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Risk Level</label>
              <div className="flex gap-2">
                {RISK_LEVELS.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => set('riskLevel', r)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                      form.riskLevel === r
                        ? r === 'Low' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : r === 'Medium' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                          : 'bg-red-500/20 border-red-500/50 text-red-400'
                        : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Investment Type</label>
              <select
                value={form.investmentType}
                onChange={e => set('investmentType', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition-all appearance-none"
              >
                {INVESTMENT_TYPES.map(t => <option key={t} value={t} className="bg-obsidian-900">{t}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Highlights (one per line)</label>
              <textarea
                value={form.highlights}
                onChange={e => set('highlights', e.target.value)}
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition-all resize-none"
                placeholder={"3x YoY growth\n$2M ARR\nProfitable since 2023"}
              />
            </div>
          </motion.div>
        </div>

        {/* Save button (bottom) */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-obsidian-950 text-sm font-semibold transition-all disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
