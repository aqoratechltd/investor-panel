'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import {
  TrendingUp, BarChart3, Shield, Coins, Users, ArrowRight,
  ChevronRight, Star, CheckCircle, Zap, Globe, Lock,
  TrendingDown, Activity, DollarSign, Menu, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description: 'Track portfolio performance with live charts, ROI metrics, and profit/loss analytics across all investment channels.',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10 border-brand-500/20',
  },
  {
    icon: Coins,
    title: 'Custom Coin System',
    description: 'Create investment tokens for each channel — MetaCoin, TikTokCoin, GrowthCoin — with automatic profit formulas.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: Users,
    title: 'Multi-Tenant Platform',
    description: 'Sellers get their own isolated workspace with full investor management, complete data separation per tenant.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    description: 'JWT authentication, 2FA support, bcrypt password hashing, role-based access control, and full audit trails.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: Globe,
    title: 'Multi-Channel Tracking',
    description: 'Manage Meta Ads, TikTok Ads, Google Ads, WhatsApp Marketing and custom channels in one unified dashboard.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: Zap,
    title: 'AI-Powered Insights',
    description: 'Get intelligent profit projections, trend analysis, and actionable recommendations powered by data intelligence.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
  },
]

const STATS = [
  { value: '$2.4B+', label: 'Assets Under Tracking', icon: DollarSign },
  { value: '14,200+', label: 'Active Investors', icon: Users },
  { value: '340+', label: 'Seller Tenants', icon: Activity },
  { value: '99.9%', label: 'Platform Uptime', icon: TrendingUp },
]

const TESTIMONIALS = [
  {
    name: 'Ahmed Malik',
    role: 'Investment Seller',
    avatar: 'AM',
    color: '#06b6d4',
    text: 'InvestorPanel completely transformed how I manage my 200+ investors. The coin system is genius — my clients love seeing their MetaCoin and TikTokCoin performance in real time.',
  },
  {
    name: 'Sarah Chen',
    role: 'Portfolio Investor',
    avatar: 'SC',
    color: '#10b981',
    text: 'The dashboard feels like a premium trading platform. I can track all my channel investments, see daily P&L, and request withdrawals with just a few clicks.',
  },
  {
    name: 'Raza Khan',
    role: 'Digital Marketing Seller',
    avatar: 'RK',
    color: '#8b5cf6',
    text: 'Managing subscriptions, investor coins, and reports used to take me hours. Now everything is automated. The export features alone saved my team 10 hours a week.',
  },
]

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="gradient-border p-6 group hover:shadow-glow transition-all duration-300 cursor-default"
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}
    >
      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 ${feature.bg}`}>
        <feature.icon className={`w-6 h-6 ${feature.color}`} />
      </div>
      <h3 className="text-base font-display font-bold mb-2">{feature.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
    </motion.div>
  )
}

function NavBar() {
  const [open, setOpen] = useState(false)
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-brand-400" />
          </div>
          <span className="font-display font-bold text-brand-400 text-lg">InvestorPanel</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Pricing', 'Docs', 'Blog'].map((item) => (
            <Link
              key={item}
              href={item === 'Pricing' ? '/pricing' : '#'}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {item}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="gap-1.5">
              Get started <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-3">
          {['Features', 'Pricing', 'Docs', 'Blog'].map((item) => (
            <Link key={item} href="#" className="block text-sm text-muted-foreground py-2" onClick={() => setOpen(false)}>
              {item}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login"><Button variant="outline" className="w-full">Sign in</Button></Link>
            <Link href="/register"><Button className="w-full">Get started</Button></Link>
          </div>
        </div>
      )}
    </nav>
  )
}

export default function LandingPage() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -60])

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <NavBar />

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden"
      >
        {/* Background effects */}
        <div className="absolute inset-0 bg-mesh-gradient" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-brand-500/5 blur-3xl pointer-events-none" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <motion.div
          style={{ y: heroY }}
          className="relative z-10 text-center max-w-5xl mx-auto px-6 pt-16"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8 glass-card border border-brand-500/20"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-muted-foreground">Now with AI-powered investment insights</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-display font-bold leading-[1.05] tracking-tight mb-8"
          >
            The investment
            <br />
            platform built for{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-emerald-400 bg-clip-text text-transparent">
                growth.
              </span>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full origin-left"
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            A multi-tenant SaaS platform that empowers sellers to manage investors and track performance across all marketing channels — with real-time analytics, custom coins, and powerful reporting.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/register">
              <Button size="xl" className="gap-2 shadow-glow-lg font-semibold min-w-[180px]">
                Start free trial
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="glass" size="xl" className="gap-2 font-medium min-w-[180px]">
                View live demo
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-4 text-xs text-muted-foreground"
          >
            14-day free trial · No credit card required · Cancel anytime
          </motion.p>

          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-20 relative"
          >
            {/* Glow behind dashboard */}
            <div className="absolute -inset-4 bg-gradient-to-b from-brand-500/10 to-transparent rounded-3xl blur-2xl" />

            <div className="relative gradient-border overflow-hidden rounded-2xl"
              style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(10,22,40,0.95) 100%)' }}
            >
              {/* Dashboard mock UI */}
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {['bg-red-400', 'bg-amber-400', 'bg-emerald-400'].map((c, i) => (
                      <div key={i} className={`w-3 h-3 rounded-full ${c} opacity-60`} />
                    ))}
                  </div>
                  <div className="h-5 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-muted-foreground font-mono">investorpanel.io/investor</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                {[
                  { label: 'Total Invested', value: '$248,500', change: '+12.4%', positive: true },
                  { label: 'Total Profit', value: '$34,200', change: '+8.7%', positive: true },
                  { label: 'Total Loss', value: '$2,100', change: '-0.8%', positive: false },
                  { label: 'Net ROI', value: '+13.2%', change: '+2.1%', positive: true },
                ].map((stat, i) => (
                  <div key={i} className="glass-card p-4">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">{stat.label}</p>
                    <p className="text-xl font-display font-bold font-mono mb-1">{stat.value}</p>
                    <span className={`text-xs font-mono flex items-center gap-1 ${stat.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {stat.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {stat.change}
                    </span>
                  </div>
                ))}
              </div>

              {/* Chart area mock — heights are deterministic to avoid SSR/client mismatch */}
              <div className="px-6 pb-6">
                <div className="glass-card p-4 h-32 flex items-end gap-1 overflow-hidden">
                  {Array.from({ length: 28 }).map((_, i) => {
                    const height = 20 + Math.sin(i * 0.4) * 20 + Math.sin(i * 1.7 + 2.3) * 15
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm"
                        style={{
                          height: `${height}%`,
                          background: `linear-gradient(180deg, rgba(6,182,212,${0.4 + (i / 28) * 0.4}) 0%, rgba(6,182,212,0.1) 100%)`,
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Floating labels */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -right-4 lg:-right-8 top-1/4 glass-card p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5" style={{ boxShadow: '0 4px 20px rgba(16,185,129,0.12)' }}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-xs font-mono font-bold text-emerald-400">+$8,420</p>
                  <p className="text-[10px] text-muted-foreground">Today's profit</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -left-4 lg:-left-8 bottom-1/3 glass-card p-3 rounded-xl border border-brand-500/20 bg-brand-500/5" style={{ boxShadow: '0 4px 20px rgba(6,182,212,0.12)' }}
            >
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-xs font-mono font-bold text-amber-400">842 MetaCoins</p>
                  <p className="text-[10px] text-muted-foreground">Earned today</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-20 border-y border-border bg-obsidian-950/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat, i) => {
              const ref = useRef(null)
              const inView = useInView(ref, { once: true })
              return (
                <motion.div
                  key={i}
                  ref={ref}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <p className="text-3xl lg:text-4xl font-display font-bold text-brand-400 mb-2">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-28 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="section-title">Platform Features</p>
              <h2 className="text-4xl lg:text-5xl font-display font-bold mb-4">
                Everything you need to<br />manage investments
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Built for sellers who manage investors at scale, and investors who demand professional-grade portfolio visibility.
              </p>
            </motion.div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <FeatureCard key={i} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Panel showcase */}
      <section className="py-28 bg-obsidian-950/50 border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="section-title">Three Powerful Panels</p>
              <h2 className="text-4xl font-display font-bold">Built for every role</h2>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {[
              {
                role: 'Super Admin',
                color: 'violet',
                icon: Shield,
                description: 'Full platform control. Manage sellers, subscriptions, ad networks, and monitor all platform activity.',
                features: ['Seller approval & suspension', 'Per-seat subscription billing', 'Ad network management', 'Platform analytics', 'Withdrawal monitoring'],
              },
              {
                role: 'Seller Portal',
                color: 'brand',
                icon: TrendingUp,
                description: 'Your own investor management workspace. Create coins, allocate investments, and track performance.',
                features: ['Investor management CRM', 'Custom investment coins', 'Channel performance tracking', 'Team collaboration tools', 'PDF/Excel/CSV reports'],
              },
              {
                role: 'Investor Hub',
                color: 'emerald',
                icon: Activity,
                description: 'A premium trading-style dashboard for investors to monitor portfolios and manage withdrawals.',
                features: ['Real-time portfolio charts', 'Daily/weekly/monthly P&L', 'Coin rewards system', 'Withdrawal requests', 'Achievement badges'],
              },
            ].map((panel, i) => {
              const colorMap: Record<string, string> = {
                violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
                brand: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
                emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
              }
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="gradient-border p-8 flex flex-col"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}
                >
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-6 ${colorMap[panel.color]}`}>
                    <panel.icon className={`w-6 h-6 ${colorMap[panel.color].split(' ')[0]}`} />
                  </div>
                  <h3 className="text-xl font-display font-bold mb-3">{panel.role}</h3>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{panel.description}</p>
                  <ul className="space-y-2.5 flex-1">
                    {panel.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm">
                        <CheckCircle className={`w-4 h-4 flex-shrink-0 ${colorMap[panel.color].split(' ')[0]}`} />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className="mt-8">
                    <Button variant="outline" className="w-full gap-2">
                      Get started <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="section-title">Testimonials</p>
            <h2 className="text-4xl font-display font-bold">Loved by investors & sellers</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="gradient-border p-6"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: t.color + '33', color: t.color }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-500/8 blur-3xl rounded-full" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-display font-bold mb-6">
              Ready to transform<br />your investment management?
            </h2>
            <p className="text-muted-foreground text-lg mb-10">
              Start your 14-day free trial. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="xl" className="gap-2 shadow-glow-lg font-semibold min-w-[180px]">
                  Start free trial <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="glass" size="xl" className="min-w-[160px]">
                  View pricing
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-brand-500/20 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-brand-400" />
            </div>
            <span className="font-display font-bold text-brand-400">InvestorPanel</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2025 InvestorPanel. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Support', 'Docs'].map((item) => (
              <Link key={item} href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
