'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, XCircle, Send, ChevronRight, Clock,
  MessageSquare, User, DollarSign, FileText, ExternalLink,
  ChevronDown, ChevronUp, Circle,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { useMarketplaceStore, type Inquiry, type ChatMessage } from '@/stores/marketplace.store'
import { useAuthStore } from '@/stores/auth.store'

// ── Toast notification ────────────────────────────────────────
function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 60, scale: 0.9 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl shadow-2xl"
    >
      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      <span className="text-sm text-emerald-300">{message}</span>
    </motion.div>
  )
}

// ── Lead Row ──────────────────────────────────────────────────
function LeadRow({
  inquiry,
  isSelected,
  onClick,
}: {
  inquiry: Inquiry
  isSelected: boolean
  onClick: () => void
}) {
  const initials = inquiry.investorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      className={cn(
        'w-full text-left p-4 border-b border-white/[0.06] transition-all duration-200 flex items-start gap-3',
        isSelected ? 'bg-brand-500/10 border-l-2 border-l-brand-500' : 'hover:bg-white/[0.03]',
      )}
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400/20 to-brand-600/20 border border-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-400 flex-shrink-0">
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-sm font-semibold truncate">{inquiry.investorName}</p>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {formatDate(inquiry.createdAt, 'relative')}
          </span>
        </div>
        <p className="text-xs text-brand-400 truncate">{inquiry.assetName}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs font-mono text-emerald-400">
            ${formatCurrency(inquiry.requestedAmount).replace('$', '')}
          </span>
          <StatusBadge status={inquiry.status} />
        </div>
      </div>

      {isSelected && <ChevronRight className="w-4 h-4 text-brand-400 flex-shrink-0 self-center" />}
    </motion.button>
  )
}

// ── Expandable Section ────────────────────────────────────────
function ExpandableCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-white/8 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="w-4 h-4 text-brand-400" />
          {title}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-white/[0.06] pt-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Chat Bubble ───────────────────────────────────────────────
function ChatBubble({ msg, isMine }: { msg: ChatMessage; isMine: boolean }) {
  return (
    <div className={cn('flex items-end gap-2 max-w-[80%]', isMine ? 'ml-auto flex-row-reverse' : '')}>
      {/* Avatar */}
      <div className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0',
        isMine ? 'bg-brand-500/20 text-brand-400' : 'bg-emerald-500/20 text-emerald-400',
      )}>
        {msg.senderName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
      </div>

      <div className={cn('flex flex-col gap-1', isMine ? 'items-end' : 'items-start')}>
        <span className="text-[10px] text-muted-foreground px-1">{msg.senderName}</span>
        <div className={cn(
          'px-3 py-2 rounded-2xl text-sm leading-relaxed max-w-sm',
          isMine
            ? 'bg-brand-500/15 border border-brand-500/20 text-foreground rounded-br-sm'
            : 'bg-white/[0.05] border border-white/8 text-foreground/90 rounded-bl-sm',
        )}>
          {msg.content}
        </div>
        <span className="text-[10px] text-muted-foreground/60 px-1">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

// ── Chat Panel ────────────────────────────────────────────────
function ChatPanel({ leadId }: { leadId: string }) {
  const { chatMessages, sendMessage } = useMarketplaceStore()
  const { user } = useAuthStore()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const messages = chatMessages[leadId] || []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = () => {
    if (!input.trim() || !user) return
    sendMessage(
      leadId,
      user.id,
      `${user.firstName} ${user.lastName}`,
      'SELLER',
      input.trim(),
    )
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
            <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-0.5">Start the conversation below</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              msg={msg}
              isMine={msg.senderRole === 'SELLER'}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/8 flex items-end gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          rows={2}
          placeholder="Type a message... (Enter to send)"
          className="flex-1 px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
        />
        <Button
          size="icon"
          className="flex-shrink-0 self-end"
          onClick={handleSend}
          disabled={!input.trim()}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Right Detail Panel ────────────────────────────────────────
function LeadDetail({
  inquiry,
  onApprove,
  onReject,
}: {
  inquiry: Inquiry
  onApprove: () => void
  onReject: () => void
}) {
  const initials = inquiry.investorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex flex-col h-full">
      {/* Lead Header */}
      <div className="p-6 border-b border-white/8 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400/20 to-brand-600/20 border border-brand-500/30 flex items-center justify-center font-bold text-brand-400">
              {initials}
            </div>
            <div>
              <h3 className="font-display font-bold">{inquiry.investorName}</h3>
              <p className="text-sm text-muted-foreground">{inquiry.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{inquiry.phone}</p>
            </div>
          </div>
          <StatusBadge status={inquiry.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/8">
            <p className="text-xs text-muted-foreground mb-0.5">Asset</p>
            <p className="text-sm font-semibold text-brand-400">{inquiry.assetName}</p>
            <p className="text-[10px] text-muted-foreground">{inquiry.assetType}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/8">
            <p className="text-xs text-muted-foreground mb-0.5">Requested Amount</p>
            <p className="text-base font-bold font-mono text-emerald-400">
              {formatCurrency(inquiry.requestedAmount)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatDate(inquiry.createdAt, 'relative')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {inquiry.status === 'PENDING' && (
          <div className="flex gap-3 mt-4">
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={onReject}
            >
              <XCircle className="w-4 h-4" />
              Reject
            </Button>
            <Button
              variant="profit"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={onApprove}
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </Button>
          </div>
        )}

        {inquiry.status === 'APPROVED' && (
          <div className="mt-4">
            <Link href={`/seller/portfolio-manager?investorId=${inquiry.investorId}`}>
              <Button className="w-full gap-2" size="sm">
                <ExternalLink className="w-4 h-4" />
                Open Portfolio Manager
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Expandable Cards */}
      <div className="p-4 space-y-3 flex-shrink-0">
        <ExpandableCard title="Investment Thesis" icon={FileText}>
          {inquiry.investmentThesis}
        </ExpandableCard>
        <ExpandableCard title="Portfolio History" icon={DollarSign}>
          {inquiry.portfolioHistory}
        </ExpandableCard>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-h-0 border-t border-white/8">
        <div className="px-4 py-2.5 flex items-center gap-2 border-b border-white/[0.06] flex-shrink-0">
          <MessageSquare className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-medium">Live Chat</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400">
            <Circle className="w-1.5 h-1.5 fill-emerald-400" />
            Online
          </span>
        </div>
        <div className="flex-1 min-h-0">
          <ChatPanel leadId={inquiry.id} />
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function LeadsPage() {
  const { inquiries, approveInquiry, rejectInquiry } = useMarketplaceStore()
  const [selectedId, setSelectedId] = useState<string | null>(inquiries[0]?.id || null)
  const [tab, setTab] = useState<'PENDING' | 'APPROVED' | 'ALL'>('ALL')
  const [toast, setToast] = useState<string | null>(null)

  const filteredInquiries = inquiries.filter((inq) => {
    if (tab === 'ALL') return true
    return inq.status === tab
  })

  const selectedInquiry = inquiries.find((i) => i.id === selectedId) || null

  const handleApprove = (id: string) => {
    approveInquiry(id)
    setToast('Lead approved! Portfolio Manager is now available.')
  }

  const handleReject = (id: string) => {
    rejectInquiry(id)
    setToast('Lead rejected.')
  }

  const pendingCount = inquiries.filter((i) => i.status === 'PENDING').length

  return (
    <DashboardLayout role="SELLER" title="Leads" subtitle="Manage investor inquiries and communications">
      <div className="flex h-[calc(100vh-140px)] gap-0 rounded-2xl border border-white/8 overflow-hidden">
        {/* Left Panel */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-white/[0.01] border-r border-white/8">
          {/* Tabs */}
          <div className="p-3 border-b border-white/8 flex gap-1">
            {(['ALL', 'PENDING', 'APPROVED'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 text-xs py-1.5 rounded-lg font-medium transition-all',
                  tab === t ? 'bg-brand-500/15 text-brand-400' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t}
                {t === 'PENDING' && pendingCount > 0 && (
                  <span className="ml-1 text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Lead List */}
          <div className="flex-1 overflow-y-auto">
            {filteredInquiries.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No leads found</p>
              </div>
            ) : (
              filteredInquiries.map((inq) => (
                <LeadRow
                  key={inq.id}
                  inquiry={inq}
                  isSelected={selectedId === inq.id}
                  onClick={() => setSelectedId(inq.id)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/8 text-xs text-muted-foreground text-center">
            {filteredInquiries.length} lead{filteredInquiries.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {selectedInquiry ? (
            <LeadDetail
              inquiry={selectedInquiry}
              onApprove={() => handleApprove(selectedInquiry.id)}
              onReject={() => handleReject(selectedInquiry.id)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/8 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 opacity-30" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Select a lead</p>
                <p className="text-xs mt-0.5">Choose a lead from the list to view details and chat</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
      </AnimatePresence>
    </DashboardLayout>
  )
}
