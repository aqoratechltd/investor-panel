// ============================================================
// SHARED TYPES — Investor Panel SaaS Platform
// ============================================================

export type Role = 'SUPER_ADMIN' | 'SELLER' | 'INVESTOR'

export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'TRIAL' | 'CANCELLED' | 'PAST_DUE'
export type SubscriptionPlan = 'STARTER' | 'GROWTH' | 'ENTERPRISE' | 'CUSTOM'

export type InvestmentStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'PENDING'
export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED'
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'PROFIT' | 'LOSS' | 'FEE' | 'COIN_EARN' | 'COIN_SPEND' | 'REFUND'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// ─────────────────────────────────────────
// API RESPONSE WRAPPER
// ─────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  meta?: PaginationMeta
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginationQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// ─────────────────────────────────────────
// AUTH TYPES
// ─────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
  twoFactorCode?: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: UserProfile
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  role: Role
  inviteCode?: string
}

export interface JwtPayload {
  sub: string
  email: string
  role: Role
  tenantId: string
  iat: number
  exp: number
}

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  tenantId: string
  avatarUrl?: string
  phone?: string
  isEmailVerified: boolean
  twoFactorEnabled: boolean
  createdAt: string
}

// ─────────────────────────────────────────
// DASHBOARD METRICS
// ─────────────────────────────────────────

export interface SuperAdminMetrics {
  totalSellers: number
  activeSellers: number
  pendingSellers: number
  totalInvestors: number
  totalInvestments: number
  totalPlatformRevenue: number
  totalActiveSubscriptions: number
  monthlyRevenueTrend: ChartDataPoint[]
  sellerGrowth: ChartDataPoint[]
  subscriptionBreakdown: PieChartData[]
}

export interface SellerMetrics {
  totalInvestors: number
  activeInvestors: number
  totalInvested: number
  totalProfit: number
  totalLoss: number
  netPnL: number
  pendingWithdrawals: number
  pendingWithdrawalAmount: number
  channelPerformance: ChannelPerformance[]
  investmentTrend: ChartDataPoint[]
  topInvestors: TopInvestor[]
}

export interface InvestorMetrics {
  totalInvested: number
  currentValue: number
  totalProfit: number
  totalLoss: number
  netROI: number
  netROIPercent: number
  coinBalance: number
  dailyProfit: number
  weeklyProfit: number
  monthlyProfit: number
  portfolioAllocation: PieChartData[]
  performanceTrend: ChartDataPoint[]
  recentTransactions: Transaction[]
}

export interface ChannelPerformance {
  channel: string
  invested: number
  currentValue: number
  profitLoss: number
  profitPercent: number
  investors: number
}

export interface TopInvestor {
  id: string
  name: string
  totalInvested: number
  totalProfit: number
  roi: number
}

// ─────────────────────────────────────────
// CHART TYPES
// ─────────────────────────────────────────

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface PieChartData {
  name: string
  value: number
  color?: string
  percent?: number
}

export interface OHLCDataPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

// ─────────────────────────────────────────
// ENTITY TYPES
// ─────────────────────────────────────────

export interface Seller {
  id: string
  tenantId: string
  companyName: string
  businessType?: string
  totalInvestors: number
  totalInvested: number
  totalProfit: number
  commissionRate: number
  isApproved: boolean
  isSuspended: boolean
  website?: string
  description?: string
  user: UserProfile
  createdAt: string
}

export interface Investor {
  id: string
  tenantId: string
  sellerId: string
  totalInvested: number
  totalProfit: number
  totalWithdrawn: number
  coinBalance: number
  referralCode?: string
  riskProfile?: string
  isActive: boolean
  kycStatus: string
  user: UserProfile
  createdAt: string
}

export interface Investment {
  id: string
  tenantId: string
  sellerId: string
  investorId: string
  name: string
  description?: string
  channel: InvestmentChannel
  coinId?: string
  coin?: Coin
  amount: number
  currentValue: number
  profitLoss: number
  profitPercent: number
  status: InvestmentStatus
  startDate: string
  endDate?: string
  createdAt: string
}

export type InvestmentChannel = 'META_ADS' | 'TIKTOK_ADS' | 'WHATSAPP' | 'GOOGLE_ADS' | 'OTHER'

export interface Coin {
  id: string
  tenantId: string
  sellerId: string
  name: string
  symbol: string
  description?: string
  iconUrl?: string
  returnFormula?: string
  returnRate: number
  isPositive: boolean
  totalSupply: number
  currentPrice: number
  createdAt: string
}

export interface Transaction {
  id: string
  tenantId: string
  investorId: string
  investmentId?: string
  type: TransactionType
  amount: number
  currency: string
  description?: string
  reference?: string
  createdAt: string
}

export interface Withdrawal {
  id: string
  tenantId: string
  investorId: string
  amount: number
  currency: string
  method: string
  accountDetails: Record<string, unknown>
  status: WithdrawalStatus
  requestedAt: string
  processedAt?: string
  rejectionReason?: string
  investor?: Investor
}

export interface Subscription {
  id: string
  tenantId: string
  sellerId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  pricePerMonth: number
  pricePerSeat: number
  maxInvestors: number
  currentSeats: number
  trialEndsAt?: string
  currentPeriodEnd: string
  seller?: Seller
}

export interface Ad {
  id: string
  title: string
  description?: string
  imageUrl?: string
  linkUrl?: string
  placement: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DRAFT'
  impressions: number
  clicks: number
  ctr: number
  startsAt: string
  endsAt?: string
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  assignedTo?: string
  assignee?: UserProfile
  createdAt: string
}

export interface Meeting {
  id: string
  title: string
  description?: string
  scheduledAt: string
  duration: number
  meetingLink?: string
  participants: string[]
  createdAt: string
}

export interface Badge {
  id: string
  name: string
  description: string
  iconUrl?: string
  criteria: string
  earnedAt?: string
}

// ─────────────────────────────────────────
// PLAN CONFIGS
// ─────────────────────────────────────────

export interface PlanConfig {
  id: string
  name: string
  plan: SubscriptionPlan
  pricePerMonth: number
  pricePerSeat: number
  maxInvestors: number
  features: string[]
  isActive: boolean
  stripePriceId?: string
}

// ─────────────────────────────────────────
// ACTIVITY LOG
// ─────────────────────────────────────────

export interface ActivityLog {
  id: string
  userId?: string
  user?: UserProfile
  action: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  createdAt: string
}
