import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Get } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { JwtRefreshGuard } from '../../guards/jwt-refresh.guard'
import { JwtAuthGuard } from '../../guards/jwt-auth.guard'

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email & password' })
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body)
  }

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  async register(
    @Body() body: { email: string; password: string; firstName: string; lastName: string; role: string; inviteCode?: string },
    @Req() req: any,
  ) {
    // Default tenant for platform-level registration
    const tenantId = req.headers['x-tenant-id'] || 'platform'
    return this.authService.register(body as any, tenantId)
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Req() req: any) {
    return this.authService.refreshTokens(req.user.sub, req.user.refreshToken)
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout' })
  async logout(@Req() req: any) {
    return this.authService.logout(req.user.sub)
  }

  @Post('create-demo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a verified demo investor account for testing' })
  async createDemo() {
    return this.authService.createDemoAccount()
  }

  @Post('seller-application-decision')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send approval or rejection email for seller application' })
  async sellerApplicationDecision(
    @Body() body: { uid: string; decision: 'APPROVED' | 'REJECTED'; email: string; name: string; companyName: string; reason?: string },
  ) {
    return this.authService.sellerApplicationDecision(body)
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async me(@Req() req: any) {
    return { user: req.user }
  }
}
