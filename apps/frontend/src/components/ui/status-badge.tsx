import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  // Investment
  ACTIVE: { label: 'Active', className: 'badge-profit' },
  PAUSED: { label: 'Paused', className: 'badge-warning' },
  CLOSED: { label: 'Closed', className: 'badge-neutral' },
  PENDING: { label: 'Pending', className: 'badge-warning' },
  // Withdrawal
  APPROVED: { label: 'Approved', className: 'badge-profit' },
  REJECTED: { label: 'Rejected', className: 'badge-loss' },
  PROCESSING: { label: 'Processing', className: 'badge-info' },
  COMPLETED: { label: 'Completed', className: 'badge-profit' },
  // Subscription
  TRIAL: { label: 'Trial', className: 'badge-info' },
  INACTIVE: { label: 'Inactive', className: 'badge-neutral' },
  CANCELLED: { label: 'Cancelled', className: 'badge-loss' },
  PAST_DUE: { label: 'Past Due', className: 'badge-loss' },
  // User/Seller
  TRUE: { label: 'Approved', className: 'badge-profit' },
  FALSE: { label: 'Pending', className: 'badge-warning' },
  SUSPENDED: { label: 'Suspended', className: 'badge-loss' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status.toUpperCase()] || {
    label: status,
    className: 'badge-neutral',
  }

  return (
    <span className={cn(config.className, className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
      {config.label}
    </span>
  )
}
