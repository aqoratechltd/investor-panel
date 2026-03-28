import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { SellersModule } from './modules/sellers/sellers.module'
import { InvestorsModule } from './modules/investors/investors.module'
import { InvestmentsModule } from './modules/investments/investments.module'
import { CoinsModule } from './modules/coins/coins.module'
import { WithdrawalsModule } from './modules/withdrawals/withdrawals.module'
import { TransactionsModule } from './modules/transactions/transactions.module'
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module'
import { AdsModule } from './modules/ads/ads.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { AnalyticsModule } from './modules/analytics/analytics.module'
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { AdminModule } from './modules/admin/admin.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    UsersModule,
    SellersModule,
    InvestorsModule,
    InvestmentsModule,
    CoinsModule,
    WithdrawalsModule,
    TransactionsModule,
    SubscriptionsModule,
    AdsModule,
    NotificationsModule,
    AnalyticsModule,
    DashboardModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
