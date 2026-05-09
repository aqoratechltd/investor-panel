'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Send, Search, Phone } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { useSellerStore } from '@/stores/seller.store'
import { useAuthStore } from '@/stores/auth.store'

const STATUS_COLOR: Record<string, string> = {
  ONLINE: 'bg-emerald-400',
  AWAY: 'bg-amber-400',
  OFFLINE: 'bg-slate-500',
}

const AVATAR_COLORS = [
  'from-brand-400 to-brand-600',
  'from-violet-400 to-violet-600',
  'from-emerald-400 to-emerald-600',
  'from-amber-400 to-amber-600',
  'from-red-400 to-red-600',
]

export default function SellerTeamPage() {
  const { contacts, messages, sendMessage, markContactRead } = useSellerStore()
  const { user } = useAuthStore()
  const [selectedId, setSelectedId] = useState(contacts[0]?.id ?? '')
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const selectedContact = contacts.find(c => c.id === selectedId) ?? contacts[0]
  const filteredContacts = contacts.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
  const chatMessages = messages.filter(m => m.contactId === selectedId)

  useEffect(() => {
    if (selectedId) markContactRead(selectedId)
  }, [selectedId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages.length])

  const handleSend = () => {
    if (!message.trim() || !selectedId) return
    sendMessage(selectedId, message.trim(), user ? `${user.firstName} ${user.lastName}` : 'User')
    setMessage('')
  }

  const selectContact = (id: string) => {
    setSelectedId(id)
    markContactRead(id)
  }

  if (!selectedContact) return null

  return (
    <DashboardLayout role="SELLER" title="Team Messaging" subtitle="Communicate with your investors and team">
      <div className="flex gap-0 gradient-border overflow-hidden" style={{ height: 'calc(100vh - 200px)', background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>

        {/* Contacts Sidebar */}
        <div className="w-72 flex-shrink-0 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..."
                className="w-full bg-obsidian-900 border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-500/50 transition-all" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredContacts.map((contact, idx) => (
              <button key={contact.id} onClick={() => selectContact(contact.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors border-b border-border/50 text-left ${selectedId === contact.id ? 'bg-brand-500/5' : ''}`}>
                <div className="relative flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-sm font-bold text-white`}>
                    {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-obsidian-950 ${STATUS_COLOR[contact.status]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-medium truncate">{contact.name}</p>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {new Date(contact.lastSeen).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate">{contact.lastMessage}</p>
                    {contact.unread > 0 && (
                      <span className="ml-2 flex-shrink-0 w-5 h-5 bg-brand-500 text-obsidian-950 text-xs font-bold rounded-full flex items-center justify-center">{contact.unread}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_COLORS[contacts.indexOf(selectedContact) % AVATAR_COLORS.length]} flex items-center justify-center text-sm font-bold text-white`}>
                  {selectedContact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-obsidian-950 ${STATUS_COLOR[selectedContact.status]}`} />
              </div>
              <div>
                <p className="text-sm font-semibold">{selectedContact.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{selectedContact.status.toLowerCase()} · {selectedContact.role}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="icon-sm" variant="ghost" className="h-8 w-8"><Phone className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {chatMessages.map((msg, i) => {
              const isMe = msg.senderId === 'seller'
              return (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-brand-500/20 text-brand-100 rounded-tr-sm' : 'bg-obsidian-800 text-foreground rounded-tl-sm'}`}>
                      {msg.content}
                    </div>
                    <span className="text-xs text-muted-foreground px-1">
                      {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              )
            })}
            {chatMessages.length === 0 && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Start a conversation</p>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex gap-3">
              <input value={message} onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={`Message ${selectedContact.name}...`}
                className="flex-1 bg-obsidian-900 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all" />
              <Button variant="brand" size="icon-sm" className="h-10 w-10" onClick={handleSend}><Send className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
