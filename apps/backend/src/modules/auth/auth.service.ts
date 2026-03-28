import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import * as nodemailer from 'nodemailer'
import { prisma } from '@investor-panel/database'
import type { LoginRequest, RegisterRequest, LoginResponse, JwtPayload, Role } from '@investor-panel/shared'
import { getFirebaseAdmin } from './firebase-admin'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginRequest & { tenantId?: string }): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    })

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // Log login activity
    await prisma.activityLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'LOGIN',
      },
    })

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const tokens = await this.generateTokens(user.id, user.email, user.role as Role, user.tenantId)

    // Store refresh token hash
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshTokenHash },
    })

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as Role,
        tenantId: user.tenantId,
        avatarUrl: user.avatarUrl ?? undefined,
        phone: user.phone ?? undefined,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt.toISOString(),
      },
    }
  }

  async register(dto: RegisterRequest, tenantId: string) {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    })

    if (existing) {
      throw new ConflictException('Email already registered')
    }

    const passwordHash = await bcrypt.hash(dto.password, 12)

    const user = await prisma.user.create({
      data: {
        tenantId,
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
      },
    })

    // Create role-specific record
    if (dto.role === 'SELLER') {
      await prisma.seller.create({
        data: {
          tenantId,
          userId: user.id,
          companyName: `${dto.firstName}'s Company`,
        },
      })
    }

    return { message: 'Registration successful. Please verify your email.' }
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied')
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken)
    if (!isValid) {
      throw new UnauthorizedException('Access denied')
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role as Role, user.tenantId)
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshTokenHash },
    })

    return tokens
  }

  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    })

    await prisma.activityLog.create({
      data: {
        tenantId: (await prisma.user.findUnique({ where: { id: userId } }))!.tenantId,
        userId,
        action: 'LOGOUT',
      },
    })

    return { message: 'Logged out successfully' }
  }

  async createDemoAccount() {
    const admin = getFirebaseAdmin()
    const ts = Date.now()
    const email = `demo_${ts}@investordemo.test`

    const userRecord = await admin.auth().createUser({
      email,
      displayName: 'Demo Investor',
      emailVerified: true,
    })

    // Custom token lets the client sign in directly without email/password
    const customToken = await admin.auth().createCustomToken(userRecord.uid, {
      demo: true,
    })

    return { customToken, email, uid: userRecord.uid }
  }

  async sellerApplicationDecision(dto: {
    uid: string
    decision: 'APPROVED' | 'REJECTED'
    email: string
    name: string
    companyName: string
    reason?: string
  }) {
    const transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST', 'smtp.gmail.com'),
      port: Number(this.config.get('SMTP_PORT', 587)),
      secure: false,
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    })

    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000')

    if (dto.decision === 'APPROVED') {
      await transporter.sendMail({
        from: `"InvestorPanel" <${this.config.get('SMTP_USER', 'noreply@investorpanel.io')}>`,
        to: dto.email,
        subject: `🎉 Your Seller Application is Approved — ${dto.companyName}`,
        html: `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a1628; color: #e2e8f0; padding: 40px; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="width: 64px; height: 64px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 28px;">✅</div>
            </div>
            <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #f1f5f9;">Congratulations, ${dto.name}!</h1>
            <p style="color: #94a3b8; margin-bottom: 24px; line-height: 1.6;">
              Your seller application for <strong style="color: #e2e8f0;">${dto.companyName}</strong> has been reviewed and <strong style="color: #10b981;">approved</strong>.
              You now have full access to the InvestorPanel Seller Dashboard.
            </p>
            <a href="${frontendUrl}/seller" style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #0891b2); color: #0a1628; font-weight: 700; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 14px;">
              Access Seller Dashboard →
            </a>
            <p style="color: #64748b; font-size: 12px; margin-top: 32px;">InvestorPanel · Your Business Fundraising Platform</p>
          </div>
        `,
      }).catch(() => {})
    } else {
      await transporter.sendMail({
        from: `"InvestorPanel" <${this.config.get('SMTP_USER', 'noreply@investorpanel.io')}>`,
        to: dto.email,
        subject: `Your Seller Application — ${dto.companyName}`,
        html: `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a1628; color: #e2e8f0; padding: 40px; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="width: 64px; height: 64px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 28px;">❌</div>
            </div>
            <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #f1f5f9;">Application Not Approved</h1>
            <p style="color: #94a3b8; margin-bottom: 16px; line-height: 1.6;">
              Hi ${dto.name}, after reviewing your seller application for <strong style="color: #e2e8f0;">${dto.companyName}</strong>, our team has decided not to approve it at this time.
            </p>
            ${dto.reason ? `
            <div style="background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #fca5a5; font-size: 13px; font-weight: 600; margin: 0 0 6px;">Reason</p>
              <p style="color: #94a3b8; font-size: 14px; margin: 0;">${dto.reason}</p>
            </div>` : ''}
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
              You may reapply after the 30-day lock period expires. Please review our eligibility requirements before submitting a new application.
            </p>
            <p style="color: #64748b; font-size: 12px; margin-top: 32px;">InvestorPanel · Your Business Fundraising Platform</p>
          </div>
        `,
      }).catch(() => {})
    }

    return { success: true }
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If that email exists, a reset link has been sent.' }
    // TODO: Send reset email via nodemailer
    return { message: 'If that email exists, a reset link has been sent.' }
  }

  private async generateTokens(userId: string, email: string, role: Role, tenantId: string) {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = { sub: userId, email, role, tenantId }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ])

    return { accessToken, refreshToken }
  }
}
