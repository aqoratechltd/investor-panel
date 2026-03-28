'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, X, TrendingUp, ArrowRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const PLANS = [
  {
    name: 'Starter',
    plan: 'STARTER',
    monthlyPrice: 49,
    annualPrice: 39,
    pricePerSeat: 2,
    maxInvestors: 25,
    description: 'Perfect for new sellers just getting started.',
    color: 'text-muted-foreground',
    borderColor: 'border-border',
    features: [
      { label: 'Up to 25 investors', included: true },
      { label: '$2/seat/month extra', included: true },
      { label: 'Basic dashboard', included: true },
      { label: 'Investment tracking', included: true },
      { label: 'CSV export', included: true },
      { label: 'Custom coins', included: false },
      { label: 'AI insights', included: false },
      { label: 'Team collaboration', included: false },
      { label: 'Priority support', included: false },
    ],
  },
  {
    name: 'Growth',
    plan: 'GROWTH',
    monthlyPrice: 149,
    annualPrice: 119,
    pricePerSeat: 1.5,
    maxInvestors: 100,
    description: 'For growing sellers managing larger portfolios.',
    color: 'text-brand-400',
    borderColor: 'border-brand-500/50',
    badge: 'Most Popular',
    featured: true,
    features: [
      { label: 'Up to 100 investors', included: true },
      { label: '$1.50/seat/month extra', included: true },
      { label: 'Advanced dashboard', included: true },
      { label: 'Investment tracking', included: true },
      { label: 'PDF/Excel/CSV export', included: true },
      { label: 'Custom coins', included: true },
      { label: 'AI insights', included: true },
      { label: 'Team collaboration', included: false },
      { label: 'Priority support', included: false },
    ],
  },
  {
    name: 'Enterprise',
    plan: 'ENTERPRISE',
    monthlyPrice: 399,
    annualPrice: 319,
    pricePerSeat: 1,
    maxInvestors: -1,
    description: 'Unlimited scale for enterprise investment operations.',
    color: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    features: [
      { label: 'Unlimited investors', included: true },
      { label: '$1/seat/month extra', included: true },
      { label: 'Full dashboard suite', included: true },
      { label: 'Investment tracking', included: true },
      { label: 'All export formats', included: true },
      { label: 'Custom coins', included: true },
      { label: 'AI insights', included: true },
      { label: 'Team collaboration', included: true },
      { label: 'Dedicated support', included: true },
    ],
  },
]

const FAQS = [
  {
    q: 'Can I change plans at any time?',
    a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.',
  },
  {
    q: 'How does per-seat pricing work?',
    a: 'Each plan includes a base number of investors. Beyond that, you pay per additional investor seat each month.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes! All plans come with a 14-day free trial. No credit card required to start.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards via Stripe. For Pakistan-based sellers, EasyPaisa and JazzCash are also supported.',
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-brand-400" />
            </div>
            <span className="font-display font-bold text-brand-400">InvestorPanel</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link href="/register"><Button size="sm">Get started</Button></Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 glass-card border border-brand-500/20">
            <Zap className="w-3.5 h-3.5 text-brand-400" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl lg:text-6xl font-display font-bold mb-4">
            Pricing that scales<br />
            <span className="bg-gradient-to-r from-brand-400 to-emerald-400 bg-clip-text text-transparent">
              with your growth
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
            Start free. Scale as your investor base grows. No hidden fees.
          </p>

          {/* Annual toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={cn('text-sm', !annual ? 'text-foreground font-medium' : 'text-muted-foreground')}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors duration-300',
                annual ? 'bg-brand-500' : 'bg-muted',
              )}
            >
              <div className={cn(
                'absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300',
                annual ? 'left-7' : 'left-1',
              )} />
            </button>
            <span className={cn('text-sm', annual ? 'text-foreground font-medium' : 'text-muted-foreground')}>
              Annual
              <span className="ml-2 text-xs text-emerald-400 font-medium">Save 20%</span>
            </span>
          </div>
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.plan}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                'rounded-2xl border p-8 flex flex-col relative overflow-hidden',
                plan.featured
                  ? 'border-brand-500/50 shadow-glow'
                  : 'border-border',
                plan.featured
                  ? 'bg-gradient-to-b from-brand-500/8 to-transparent'
                  : 'bg-gradient-to-b from-white/[0.03] to-transparent',
              )}
            >
              {plan.featured && (
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent" />
              )}

              {plan.badge && (
                <div className="absolute top-6 right-6">
                  <span className="badge-info text-xs font-semibold">{plan.badge}</span>
                </div>
              )}

              <div className="mb-6">
                <p className={cn('text-sm font-semibold mb-1', plan.color)}>{plan.name}</p>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-4xl font-display font-bold">
                    ${annual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground mb-1">/mo</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <Link href="/register" className="mb-8">
                <Button
                  className="w-full gap-2"
                  variant={plan.featured ? 'default' : 'outline'}
                >
                  Start free trial
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <ul className="space-y-3 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm">
                    {f.included ? (
                      <CheckCircle className={cn('w-4 h-4 flex-shrink-0', plan.color)} />
                    ) : (
                      <X className="w-4 h-4 flex-shrink-0 text-muted-foreground/40" />
                    )}
                    <span className={f.included ? 'text-foreground' : 'text-muted-foreground/50'}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="gradient-border p-6"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)' }}
              >
                <h3 className="text-sm font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
