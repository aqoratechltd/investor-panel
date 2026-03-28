'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User, Bell, Shield, CreditCard, Save,
  Eye, EyeOff, Upload, Wallet,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'withdrawal', label: 'Withdrawal Methods', icon: Wallet },
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
        <input defaultValue={value} type={isPassword && !show ? 'password' : 'text'} placeholder={placeholder}
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
      <button onClick={() => setEnabled(!enabled)} className={`relative w-11 h-6 rounded-full transition-all duration-200 ${enabled ? 'bg-emerald-500' : 'bg-obsidian-700'}`}>
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

const SAVED_METHODS = [
  { id: '1', type: 'BANK_TRANSFER', label: 'Bank Transfer', details: 'HBL — ****4821', default: true },
  { id: '2', type: 'EASYPAISA', label: 'EasyPaisa', details: '+92-300-1234567', default: false },
]

export default function InvestorSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  return (
    <DashboardLayout role="INVESTOR" title="Settings" subtitle="Manage your profile and preferences">
      <div className="flex gap-6 flex-col lg:flex-row">
        <div className="lg:w-52 flex-shrink-0">
          <div className="gradient-border p-2" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                  activeTab === tab.id ? 'bg-emerald-500/10 text-emerald-300' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
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
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-brand-600 flex items-center justify-center text-2xl font-bold text-obsidian-950">
                    AH
                  </div>
                  <Button size="sm" variant="glass"><Upload className="w-3.5 h-3.5 mr-1.5" />Upload Photo</Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <InputField label="First Name" value="Ali" />
                  <InputField label="Last Name" value="Hassan" />
                  <InputField label="Email" value="ali.hassan@gmail.com" type="email" />
                  <InputField label="Phone" value="+92-300-1234567" />
                </div>
              </Section>
              <div className="flex justify-end">
                <Button variant="brand" size="sm"><Save className="w-4 h-4 mr-1.5" />Save Changes</Button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <Section title="Notification Preferences">
              <Toggle label="Profit updates" description="Notify when your investment profit is updated" defaultChecked />
              <Toggle label="Withdrawal status" description="Updates on your withdrawal requests" defaultChecked />
              <Toggle label="New coin rewards" description="Alert when you earn coins" defaultChecked />
              <Toggle label="Performance reports" description="Monthly performance summary" defaultChecked />
              <Toggle label="New badge earned" description="Celebrate your achievements" defaultChecked />
              <Toggle label="Email notifications" description="Receive all alerts via email" defaultChecked />
              <Toggle label="Platform announcements" description="New features and updates" />
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
                <Toggle label="Two-Factor Authentication" description="Add an extra layer of security" />
                <Toggle label="Login notifications" description="Email alert on new device login" defaultChecked />
              </Section>
              <div className="flex justify-end">
                <Button variant="brand" size="sm"><Save className="w-4 h-4 mr-1.5" />Update Password</Button>
              </div>
            </div>
          )}

          {activeTab === 'withdrawal' && (
            <div>
              <Section title="Saved Withdrawal Methods">
                <div className="space-y-3 mb-4">
                  {SAVED_METHODS.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-4 bg-obsidian-900/60 rounded-xl border border-border">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{m.label}</p>
                          {m.default && <span className="text-xs bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">Default</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.details}</p>
                      </div>
                      <div className="flex gap-2">
                        {!m.default && <Button size="sm" variant="glass" className="h-7 text-xs">Set Default</Button>}
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400">Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="glass" size="sm" className="w-full">+ Add New Method</Button>
              </Section>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
