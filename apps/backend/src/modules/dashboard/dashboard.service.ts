import { Injectable } from '@nestjs/common'
import { prisma } from '@investor-panel/database'

@Injectable()
export class DashboardService {
  async getSuperAdminMetrics() {
    const [
      totalSellers,
      activeSellers,
      pendingSellers,
      totalInvestors,
      totalSubscriptions,
      revenueAggregate,
    ] = await Promise.all([
      prisma.seller.count(),
      prisma.seller.count({ where: { isApproved: true, isSuspended: false } }),
      prisma.seller.count({ where: { isApproved: false } }),
      prisma.investor.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscriptionPayment.aggregate({ _sum: { amount: true } }),
    ])

    // Monthly revenue trend (last 12 months)
    const now = new Date()
    const monthlyRevenue = await Promise.all(
      Array.from({ length: 12 }, (_, i) => {
        const start = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
        const end = new Date(now.getFullYear(), now.getMonth() - 10 + i, 0)
        return prisma.subscriptionPayment.aggregate({
          where: { paidAt: { gte: start, lte: end } },
          _sum: { amount: true },
        }).then((r) => ({
          date: start.toISOString().slice(0, 7),
          value: Number(r._sum.amount || 0),
        }))
      }),
    )

    return {
      totalSellers,
      activeSellers,
      pendingSellers,
      totalInvestors,
      totalActiveSubscriptions: totalSubscriptions,
      totalPlatformRevenue: Number(revenueAggregate._sum.amount || 0),
      monthlyRevenueTrend: monthlyRevenue,
    }
  }

  async getSellerMetrics(userId: string, tenantId: string) {
    const seller = await prisma.seller.findFirst({ where: { userId } })
    if (!seller) return null

    const [investors, investments, pendingWithdrawals] = await Promise.all([
      prisma.investor.count({ where: { sellerId: seller.id } }),
      prisma.investment.findMany({
        where: { sellerId: seller.id },
        select: { amount: true, currentValue: true, profitLoss: true, channel: true },
      }),
      prisma.withdrawal.aggregate({
        where: { tenantId, status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),
    ])

    const totalInvested = investments.reduce((s, i) => s + Number(i.amount), 0)
    const totalProfit = investments.filter(i => Number(i.profitLoss) > 0).reduce((s, i) => s + Number(i.profitLoss), 0)
    const totalLoss = investments.filter(i => Number(i.profitLoss) < 0).reduce((s, i) => s + Math.abs(Number(i.profitLoss)), 0)

    // Channel breakdown
    const channelMap: Record<string, { invested: number; pnl: number }> = {}
    investments.forEach(inv => {
      if (!channelMap[inv.channel]) channelMap[inv.channel] = { invested: 0, pnl: 0 }
      channelMap[inv.channel].invested += Number(inv.amount)
      channelMap[inv.channel].pnl += Number(inv.profitLoss)
    })

    return {
      totalInvestors: investors,
      totalInvested,
      totalProfit,
      totalLoss,
      netPnL: totalProfit - totalLoss,
      pendingWithdrawals: pendingWithdrawals._count,
      pendingWithdrawalAmount: Number(pendingWithdrawals._sum.amount || 0),
      channelPerformance: Object.entries(channelMap).map(([channel, data]) => ({
        channel,
        invested: data.invested,
        profitLoss: data.pnl,
        profitPercent: data.invested > 0 ? (data.pnl / data.invested) * 100 : 0,
      })),
    }
  }

  async getInvestorMetrics(userId: string, tenantId: string) {
    const investor = await prisma.investor.findFirst({ where: { userId } })
    if (!investor) return null

    const [investments, transactions, withdrawals] = await Promise.all([
      prisma.investment.findMany({
        where: { investorId: investor.id },
        include: { coin: true },
      }),
      prisma.transaction.findMany({
        where: { investorId: investor.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.withdrawal.findMany({
        where: { investorId: investor.id, status: 'COMPLETED' },
        select: { amount: true },
      }),
    ])

    const totalInvested = investments.reduce((s, i) => s + Number(i.amount), 0)
    const currentValue = investments.reduce((s, i) => s + Number(i.currentValue), 0)
    const totalProfit = investments.filter(i => Number(i.profitLoss) > 0).reduce((s, i) => s + Number(i.profitLoss), 0)
    const totalLoss = investments.filter(i => Number(i.profitLoss) < 0).reduce((s, i) => s + Math.abs(Number(i.profitLoss)), 0)

    const portfolioAllocation = investments.map(inv => ({
      name: inv.name,
      value: Number(inv.amount),
      channel: inv.channel,
    }))

    // Performance over last 30 days
    const performanceTrend = await prisma.investmentPerformance.findMany({
      where: {
        investment: { investorId: investor.id },
        recordedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { recordedAt: 'asc' },
      select: { recordedAt: true, value: true, profitLoss: true },
    })

    return {
      totalInvested,
      currentValue,
      totalProfit,
      totalLoss,
      netROI: currentValue - totalInvested,
      netROIPercent: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0,
      coinBalance: Number(investor.coinBalance),
      portfolioAllocation,
      performanceTrend: performanceTrend.map(p => ({
        date: p.recordedAt.toISOString().slice(0, 10),
        value: Number(p.value),
      })),
      recentTransactions: transactions,
    }
  }
}
