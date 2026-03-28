'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Plus, Clock, Video, Phone, MapPin, Users, ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSellerStore, type Meeting } from '@/stores/seller.store'
import toast from 'react-hot-toast'

const TYPE_ICONS: Record<string, any> = { VIDEO: Video, PHONE: Phone, IN_PERSON: MapPin }
const TYPE_COLORS: Record<string, string> = {
  VIDEO: 'bg-brand-500/10 text-brand-400',
  PHONE: 'bg-violet-500/10 text-violet-400',
  IN_PERSON: 'bg-emerald-500/10 text-emerald-400',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const CAL_DATES = Array.from({ length: 31 }, (_, i) => i + 1)

function ScheduleModal({ onClose, onCreate }: { onClose: () => void; onCreate: (meeting: Omit<Meeting, 'id' | 'createdAt'>) => void }) {
  const [form, setForm] = useState({
    title: '', type: 'VIDEO' as Meeting['type'],
    attendees: '', date: new Date(Date.now() + 86400000).toISOString(),
    duration: 30, status: 'UPCOMING' as const, link: '', notes: '',
  })

  const handleCreate = () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    onCreate({ ...form, attendees: form.attendees.split(',').map(a => a.trim()).filter(Boolean) })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md gradient-border p-6 rounded-2xl" style={{ background: 'hsl(222 44% 8%)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold">Schedule Meeting</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Title *</label>
            <Input placeholder="Meeting title..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Meeting['type'] }))}
                className="w-full bg-obsidian-900 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                <option value="VIDEO">Video Call</option><option value="PHONE">Phone Call</option><option value="IN_PERSON">In Person</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Duration (min)</label>
              <Input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Date & Time</label>
            <input type="datetime-local" value={form.date.slice(0, 16)} onChange={e => setForm(f => ({ ...f, date: new Date(e.target.value).toISOString() }))}
              className="w-full bg-obsidian-900 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Attendees (comma-separated)</label>
            <Input placeholder="Ali Hassan, Sara Ahmed" value={form.attendees} onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))} />
          </div>
          {form.type === 'VIDEO' && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Meeting Link</label>
              <Input placeholder="https://meet.google.com/..." value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-5">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="brand" className="flex-1" onClick={handleCreate}>Schedule</Button>
        </div>
      </motion.div>
    </div>
  )
}

export default function SellerMeetingsPage() {
  const { meetings, createMeeting, completeMeeting, cancelMeeting } = useSellerStore()
  const [tab, setTab] = useState<'upcoming' | 'completed'>('upcoming')
  const [showSchedule, setShowSchedule] = useState(false)

  const upcomingMeetings = meetings.filter(m => m.status === 'UPCOMING')
  const completedMeetings = meetings.filter(m => m.status === 'COMPLETED')
  const display = tab === 'upcoming' ? upcomingMeetings : completedMeetings

  // Get meeting dates for calendar highlight
  const meetingDates = meetings.map(m => new Date(m.date).getDate().toString())

  return (
    <DashboardLayout role="SELLER" title="Meetings" subtitle="Schedule and manage investor meetings">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="gradient-border p-5 mb-4" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold">March 2026</h3>
              <div className="flex gap-1">
                <Button size="icon-sm" variant="ghost" className="h-7 w-7"><ChevronLeft className="w-4 h-4" /></Button>
                <Button size="icon-sm" variant="ghost" className="h-7 w-7"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(d => <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 0 }).map((_, i) => <div key={`off-${i}`} />)}
              {CAL_DATES.map(date => {
                const isToday = date === 15
                const hasMeeting = meetingDates.includes(String(date))
                return (
                  <button key={date} className={`aspect-square flex items-center justify-center text-xs rounded-lg transition-all relative ${isToday ? 'bg-brand-500 text-obsidian-950 font-bold' : hasMeeting ? 'bg-brand-500/10 text-brand-400 font-medium hover:bg-brand-500/20' : 'text-muted-foreground hover:bg-white/5'}`}>
                    {date}
                    {hasMeeting && !isToday && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-400" />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="gradient-border p-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
            <h3 className="font-display font-semibold text-sm mb-4">Upcoming Today</h3>
            {upcomingMeetings.length === 0 ? (
              <p className="text-xs text-muted-foreground">No upcoming meetings.</p>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.slice(0, 3).map(m => {
                  const Icon = TYPE_ICONS[m.type]
                  const colorClass = TYPE_COLORS[m.type]
                  return (
                    <div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl ${colorClass.split(' ')[0]}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}><Icon className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(m.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · {m.duration}min</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex gap-1 p-1 bg-obsidian-900/60 rounded-xl border border-border">
              {(['upcoming', 'completed'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-obsidian-800 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {t} ({t === 'upcoming' ? upcomingMeetings.length : completedMeetings.length})
                </button>
              ))}
            </div>
            <Button variant="brand" size="sm" onClick={() => setShowSchedule(true)}><Plus className="w-4 h-4 mr-1.5" />Schedule</Button>
          </div>

          <div className="space-y-3">
            {display.map((meeting, i) => {
              const Icon = TYPE_ICONS[meeting.type]
              const colorClass = TYPE_COLORS[meeting.type]
              return (
                <motion.div key={meeting.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="gradient-border p-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}><Icon className="w-5 h-5" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-sm">{meeting.title}</h4>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />{new Date(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />{new Date(meeting.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · {meeting.duration}min
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Users className="w-3 h-3" />{meeting.attendees.join(', ')}
                            </span>
                          </div>
                          {meeting.notes && <p className="text-xs text-muted-foreground mt-2 italic">{meeting.notes}</p>}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {meeting.status === 'UPCOMING' ? (
                            <>
                              <Button size="icon-sm" variant="ghost" className="h-7 w-7 text-emerald-400" onClick={() => { completeMeeting(meeting.id); toast.success('Meeting completed') }}><Check className="w-3.5 h-3.5" /></Button>
                              <Button size="icon-sm" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => { cancelMeeting(meeting.id); toast.success('Meeting cancelled') }}><X className="w-3.5 h-3.5" /></Button>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground px-2 py-1 bg-obsidian-800 rounded-lg">Completed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
            {display.length === 0 && (
              <div className="py-16 text-center text-sm text-muted-foreground">No {tab} meetings.</div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSchedule && <ScheduleModal onClose={() => setShowSchedule(false)} onCreate={(m) => { createMeeting(m); toast.success('Meeting scheduled') }} />}
      </AnimatePresence>
    </DashboardLayout>
  )
}
