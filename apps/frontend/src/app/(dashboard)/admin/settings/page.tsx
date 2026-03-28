'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, Shield, Bell, CreditCard, Globe,
  Save, Eye, EyeOff, Key, Mail, Smartphone,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'integrations', label: 'Integrations', icon: Globe },
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
          className="w-full bg-obsidian-900 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all pr-10"
        />
        {isPassword && (
          <button
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
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
      <button
        onClick={() => setEnabled(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-all duration-200 ${enabled ? 'bg-brand-500' : 'bg-obsidian-700'}`}
      >
        <motion.div
          animate={{ x: enabled ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
        />
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

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general')

  return (
    <DashboardLayout role="SUPER_ADMIN" title="Settings" subtitle="Configure platform preferences and security">
      <div className="flex gap-6 flex-col lg:flex-row">

        {/* Sidebar Tabs */}
        <div className="lg:w-52 flex-shrink-0">
          <div className="gradient-border p-2" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                  activeTab === tab.id
                    ? 'bg-violet-500/10 text-violet-300'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div>
              <Section title="Platform Information">
                <div className="grid gap-4">
                  <InputField label="Platform Name" value="InvestorPanel" />
                  <InputField label="Support Email" value="support@investorpanel.io" type="email" />
                  <InputField label="Platform URL" value="https://investorpanel.io" />
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Default Currency</label>
                    <select className="w-full bg-obsidian-900 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand-500/50">
                      <option value="USD">USD — US Dollar</option>
                      <option value="PKR">PKR — Pakistani Rupee</option>
                      <option value="AED">AED — UAE Dirham</option>
                    </select>
                  </div>
                </div>
              </Section>
              <Section title="Appearance">
                <Toggle label="Dark Mode Default" description="New users get dark mode by default" defaultChecked />
                <Toggle label="Show Platform Logo" description="Display InvestorPanel branding in seller portals" defaultChecked />
                <Toggle label="Allow Custom Branding" description="Enterprise sellers can upload their own logo" />
              </Section>
              <div className="flex justify-end">
                <Button variant="brand" size="sm"><Save className="w-4 h-4 mr-1.5" />Save Changes</Button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <Section title="Authentication">
                <div className="grid gap-4">
                  <InputField label="Current Password" type="password" />
                  <InputField label="New Password" type="password" hint="Minimum 12 characters, include uppercase, lowercase, number, and symbol." />
                  <InputField label="Confirm New Password" type="password" />
                </div>
              </Section>
              <Section title="Two-Factor Authentication">
                <div className="flex items-center gap-4 p-4 bg-obsidian-900/60 rounded-xl border border-border mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-5 h-5 text-brand-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Authenticator App</p>
                    <p className="text-xs text-muted-foreground">Use Google Authenticator or Authy for 2FA</p>
                  </div>
                  <Button size="sm" variant="glass">Enable</Button>
                </div>
                <Toggle label="Require 2FA for all admin logins" description="Recommended for production environments" />
                <Toggle label="Session timeout after inactivity" description="Auto-logout after 30 minutes of inactivity" defaultChecked />
              </Section>
              <Section title="API Security">
                <div className="flex items-center gap-3 p-4 bg-obsidian-900/60 rounded-xl border border-border">
                  <Key className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">API Secret Key</p>
                    <p className="text-xs font-mono text-muted-foreground truncate">sk_prod_••••••••••••••••••••••••</p>
                  </div>
                  <Button size="sm" variant="glass">Regenerate</Button>
                </div>
              </Section>
              <div className="flex justify-end">
                <Button variant="brand" size="sm"><Save className="w-4 h-4 mr-1.5" />Save Security Settings</Button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <Section title="Notification Preferences">
              <Toggle label="New seller registration" description="Get notified when a new seller signs up" defaultChecked />
              <Toggle label="Seller approval required" description="Alert when a seller is waiting for approval" defaultChecked />
              <Toggle label="Large withdrawal requests" description="Alert for withdrawals over $10,000" defaultChecked />
              <Toggle label="Failed subscription payments" description="Notify when a seller payment fails" defaultChecked />
              <Toggle label="Security alerts" description="Brute force attempts, suspicious logins" defaultChecked />
              <Toggle label="Platform performance reports" description="Weekly platform analytics summary" />
              <Toggle label="Email notifications" description="Receive all alerts via email" defaultChecked />
              <Toggle label="SMS notifications" description="Critical alerts via SMS (requires setup)" />
            </Section>
          )}

          {activeTab === 'billing' && (
            <div>
              <Section title="Stripe Configuration">
                <div className="grid gap-4">
                  <InputField label="Stripe Publishable Key" value="pk_live_••••••••••••••••" type="password" />
                  <InputField label="Stripe Secret Key" type="password" placeholder="sk_live_..." hint="Used for server-side operations. Never expose publicly." />
                  <InputField label="Stripe Webhook Secret" type="password" placeholder="whsec_..." />
                </div>
              </Section>
              <Section title="Payment Methods">
                <Toggle label="Stripe (Global)" description="Credit/debit cards, Apple Pay, Google Pay" defaultChecked />
                <Toggle label="EasyPaisa" description="Pakistan mobile payments" defaultChecked />
                <Toggle label="JazzCash" description="Pakistan mobile payments" defaultChecked />
                <Toggle label="Bank Transfer" description="Manual bank transfers" defaultChecked />
              </Section>
              <div className="flex justify-end">
                <Button variant="brand" size="sm"><Save className="w-4 h-4 mr-1.5" />Save Billing Config</Button>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <Section title="Third-Party Integrations">
              {[
                { name: 'SendGrid', desc: 'Transactional email delivery', status: true, icon: Mail },
                { name: 'Twilio', desc: 'SMS notifications and OTP', status: false, icon: Smartphone },
                { name: 'Stripe', desc: 'Payment processing', status: true, icon: CreditCard },
                { name: 'Slack', desc: 'Admin alerts and notifications', status: false, icon: Bell },
              ].map(({ name, desc, status, icon: Icon }) => (
                <div key={name} className="flex items-center justify-between py-4 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-obsidian-800 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status ? 'bg-emerald-500/10 text-emerald-400' : 'bg-obsidian-800 text-muted-foreground'}`}>
                      {status ? 'Connected' : 'Not connected'}
                    </span>
                    <Button size="sm" variant="glass">{status ? 'Configure' : 'Connect'}</Button>
                  </div>
                </div>
              ))}
            </Section>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
