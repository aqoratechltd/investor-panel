import { Controller, Get, UseGuards, Req } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { DashboardService } from './dashboard.service'
import { JwtAuthGuard } from '../../guards/jwt-auth.guard'
import { RolesGuard } from '../../guards/roles.guard'
import { Roles } from '../../decorators/roles.decorator'

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('super-admin')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Get Super Admin dashboard metrics' })
  async getSuperAdminMetrics() {
    return this.dashboardService.getSuperAdminMetrics()
  }

  @Get('seller')
  @Roles('SELLER')
  @ApiOperation({ summary: 'Get Seller dashboard metrics' })
  async getSellerMetrics(@Req() req: any) {
    return this.dashboardService.getSellerMetrics(req.user.id, req.user.tenantId)
  }

  @Get('investor')
  @Roles('INVESTOR')
  @ApiOperation({ summary: 'Get Investor dashboard metrics' })
  async getInvestorMetrics(@Req() req: any) {
    return this.dashboardService.getInvestorMetrics(req.user.id, req.user.tenantId)
  }
}
