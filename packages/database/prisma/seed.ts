import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Tenants ────────────────────────────────────────────────────
  const platformTenant = await prisma.tenant.upsert({
    where: { slug: 'platform' },
    update: {},
    create: {
      id: 'tenant_platform',
      name: 'InvestorPanel Platform',
      slug: 'platform',
      isActive: true,
    },
  })

  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      id: 'tenant_demo',
      name: 'Demo Seller Co.',
      slug: 'demo',
      isActive: true,
    },
  })

  // ─── Super Admin ────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@1234', 12)
  await prisma.user.upsert({
    where: { email: 'admin@investorpanel.io' },
    update: {},
    create: {
      id: 'user_admin',
      tenantId: platformTenant.id,
      email: 'admin@investorpanel.io',
      passwordHash: adminHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
      isEmailVerified: true,
    },
  })

  // ─── Seller ─────────────────────────────────────────────────────
  const sellerHash = await bcrypt.hash('Seller@1234', 12)
  const sellerUser = await prisma.user.upsert({
    where: { email: 'seller@demo.io' },
    update: {},
    create: {
      id: 'user_seller',
      tenantId: demoTenant.id,
      email: 'seller@demo.io',
      passwordHash: sellerHash,
      firstName: 'Demo',
      lastName: 'Seller',
      role: 'SELLER',
      isActive: true,
      isEmailVerified: true,
    },
  })

  await prisma.seller.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      id: 'seller_demo',
      tenantId: demoTenant.id,
      userId: sellerUser.id,
      companyName: 'Demo Seller Co.',
      businessType: 'Digital Advertising',
      isApproved: true,
      approvedAt: new Date(),
      commissionRate: 0.02,
    },
  })

  // ─── Investor ───────────────────────────────────────────────────
  const investorHash = await bcrypt.hash('Investor@1234', 12)
  const investorUser = await prisma.user.upsert({
    where: { email: 'investor@demo.io' },
    update: {},
    create: {
      id: 'user_investor',
      tenantId: demoTenant.id,
      email: 'investor@demo.io',
      passwordHash: investorHash,
      firstName: 'Demo',
      lastName: 'Investor',
      role: 'INVESTOR',
      isActive: true,
      isEmailVerified: true,
    },
  })

  await prisma.investor.upsert({
    where: { userId: investorUser.id },
    update: {},
    create: {
      id: 'investor_demo',
      tenantId: demoTenant.id,
      userId: investorUser.id,
      sellerId: 'seller_demo',
      totalInvested: 25000,
      totalProfit: 3420,
      coinBalance: 842,
      isActive: true,
      kycStatus: 'VERIFIED',
    },
  })

  console.log('✅ Seed complete!')
  console.log('   admin@investorpanel.io  / Admin@1234')
  console.log('   seller@demo.io          / Seller@1234')
  console.log('   investor@demo.io        / Investor@1234')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
