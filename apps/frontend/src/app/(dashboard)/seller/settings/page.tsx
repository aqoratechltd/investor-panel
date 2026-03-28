'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, User, Bell, Shield, CreditCard, Save,
  Eye, EyeOff, Building2, Upload,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
] as const
type Tab = typeof TABS[number]['id']

function InputField({ label, value, type = 'text', placeholder, hint }: {
  label: string; value?: string; type?: string; placeholder?: string; hint?: string
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      <div className="relative">
        <input
          defaultValue={value}
          type={isPassword && !show ? 'password' : 'text'}
          placeholder={placeholder}
          className="w-full bg-obsidian-900 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
        />
        {isPassword && (
          <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}

function Toggle({ label, description, defaultChecked = false }: { label: string; description?: string; defaultChecked?: boolean }) {
  const [enabled, setEnabled] = useState(defaultChecked)
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button onClick={() => setEnabled(!enabled)} className={`relative w-11 h-6 rounded-full transition-all duration-200 ${enabled ? 'bg-brand-500' : 'bg-obsidian-700'}`}>
        <motion.div animate={{ x: enabled ? 20 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
      </button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="gradient-border p-6 mb-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
      <h3 className="font-display font-bold mb-5 pb-4 border-b border-border">{title}</h3>
      {children}
    </div>
  )
}

export default function SellerSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  return (
    <DashboardLayout role="SELLER" title="Settings" subtitle="Manage your account and preferences">
      <div className="flex gap-6 flex-col lg:flex-row">
        <div className="lg:w-52 flex-shrink-0">
          <div className="gradient-border p-2" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                  activeTab === tab.id ? 'bg-brand-500/10 text-brand-300' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          {activeTab === 'profile' && (
            <div>
              <Section title="Personal Information">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-2xl font-bold text-obsidian-950">
                    JS
                  </div>
                  <Button size="sm" variant="glass"><Upload className="w-3.5 h-3.5 mr-1.5" />Upload Photo</Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <InputField label="First Name" value="John" />
                  <InputField label="Last Name" value="Smith" />
                  <InputField label="Email" value="seller@demo.io" type="email" />
                  <InputField label="Phone" value="+92-300-0000000" />
                </div>
              </Section>
              <div className="flex justify-end">
                <Button variant="brand" size="sm"><Save className="w-4 h-4 mr-1.5" />Save Changes</Button>
              </div>
            </div>
          )}

          {activeTab === 'company' && (
            <div>
              <Section title="Company Details">
                <div className="grid gap-4">
                  <InputField label="Company Name" value="Demo Investments LLC" />
                  <InputField label="Business Email" value="contact@demoinvest.io" />
                  <InputField label="Website" placeholder="https://yourcompany.com" />
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Business Type</label>
                    <select className="w-full bg-obsidian-900 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand-500/50">
                      <option>Investment Company</option>
                      <option>Financial Advisory</option>
                      <option>Marketing Agency</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Company Description</label>
                    <textarea rows={3} defaultValue="We manage investor portfolios across digital marketing channels..."
                      className="w-full bg-obsidian-900 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-500/50 resize-none"
                    />
                  </div>
                </div>
              </Section>
              <div className="flex justify-end">
                <Button variant="brand" size="sm"><Save className="w-4 h-4 mr-1.5" />Save Company Info</Button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <Section title="Notification Preferences">
              <Toggle label="Withdrawal requests" description="Notify when investors submit withdrawal requests" defaultChecked />
              <Toggle label="New investor registration" description="Alert when a new investor is onboarded" defaultChecked />
              <Toggle label="Investment performance alerts" description="Daily P&L summary for your portfolio" defaultChecked />
              <Toggle label="Low coin balance" description="Alert when an investor's coin balance is low" />
              <Toggle label="Subscription renewal reminder" description="7-day advance notice before renewal" defaultChecked />
              <Toggle label="Email notifications" description="Receive all alerts via email" defaultChecked />
            </Section>
          )}

          {activeTab === 'security' && (
            <div>
              <Section title="Change Password">
                <div className="grid gap-4">
                  <InputField label="Current Password" type="password" />
                  <InputField label="New Password" type="password" hint="Minimum 8 characters." />
                  <InputField label="Confirm New Password" type="password" />
                </div>
              </Section>
              <Section title="Security Settings">
                <Toggle label="Two-Factor Authentication" description="Secure your account with 2FA" />
                <Toggle label="Login notifications" description="Email alert on new login" defaultChecked />
                <Toggle label="Session management" description="Auto-logout after 60 minutes of inactivity" />
              </Section>
              <div className="flex justify-end">
                <Button variant="brand" size="sm"><Save className="w-4 h-4 mr-1.5" />Update Password</Button>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div>
              <div className="gradient-border p-6 mb-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
                <h3 className="font-display font-bold mb-5 pb-4 border-b border-border">Current Plan</h3>
                <div className="flex items-center justify-between p-4 bg-brand-500/5 border border-brand-500/20 rounded-xl">
                  <div>
                    <p className="font-bold text-brand-300">Growth Plan</p>
                    <p className="text-xs text-muted-foreground mt-0.5">$149/month · Renews April 10, 2025</p>
                    <p className="text-xs text-muted-foreground mt-0.5">82 / 100 investors used</p>
                  </div>
                  <Button size="sm" variant="brand">Upgrade</Button>
                </div>
              </div>
              <Section title="Payment Method">
                <div className="flex items-center gap-3 p-4 bg-obsidian-900/60 rounded-xl border border-border">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Visa ending in 4242</p>
                    <p className="text-xs text-muted-foreground">Expires 12/2026</p>
                  </div>
                  <Button size="sm" variant="glass">Update</Button>
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
