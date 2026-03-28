import { Injectable } from '@nestjs/common'
import { getFirebaseAdmin } from '../auth/firebase-admin'

@Injectable()
export class AdminService {
  private get db() {
    return getFirebaseAdmin().firestore()
  }

  // ── Businesses ────────────────────────────────────────────────────────────

  async getBusinesses() {
    const snap = await this.db.collection('businesses').orderBy('createdAt', 'desc').get()
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }

  async approveBusiness(id: string) {
    await this.db.collection('businesses').doc(id).update({
      status: 'APPROVED',
      reviewedAt: new Date().toISOString(),
      rejectionReason: null,
    })
    return { success: true }
  }

  async rejectBusiness(id: string, reason: string) {
    await this.db.collection('businesses').doc(id).update({
      status: 'REJECTED',
      rejectionReason: reason,
      reviewedAt: new Date().toISOString(),
    })
    return { success: true }
  }

  // ── Seller Applications ───────────────────────────────────────────────────

  async getSellerApplications() {
    const snap = await this.db.collection('seller_applications').orderBy('submittedAt', 'desc').get()
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }

  async approveSellerApplication(id: string) {
    const appDoc = await this.db.collection('seller_applications').doc(id).get()
    if (!appDoc.exists) throw new Error('Application not found')
    const app = appDoc.data()!

    await this.db.collection('seller_applications').doc(id).update({
      status: 'APPROVED',
      reviewedAt: new Date().toISOString(),
    })

    // Auto-create business listing if not already created
    const existing = await this.db.collection('businesses')
      .where('sellerId', '==', id)
      .where('source', '==', 'seller_application')
      .get()

    if (existing.empty) {
      await this.db.collection('businesses').add({
        sellerId: id,
        sellerName: app.fullName,
        sellerEmail: app.email,
        source: 'seller_application',
        name: app.companyName,
        description: app.businessDescription,
        tagline: '',
        category: app.industry,
        industry: app.industry,
        companySize: app.companySize,
        founded: app.founded,
        country: app.country,
        website: app.website || null,
        ttmRevenue: app.ttmRevenue,
        ttmProfit: app.ttmProfit,
        lastMonthRevenue: app.lastMonthRevenue,
        lastMonthProfit: app.lastMonthProfit,
        customers: app.customers,
        annualRecurringRevenue: app.annualRecurringRevenue,
        annualGrowthRate: app.annualGrowthRate,
        churnRate: app.churnRate,
        askingAmount:   app.askingAmount   || 0,
        minInvestment:  app.minInvestment  || 0,
        equityOffered:  app.equityOffered  || 0,
        expectedROI:    app.expectedROI    || 0,
        lockPeriod:     app.lockPeriod     || 12,
        riskLevel:      app.riskLevel      || 'Medium',
        investmentType: app.investmentType || 'Equity',
        highlights:     app.highlights     || [],
        status: 'PENDING',
        viewCount: 0,
        interestedCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reviewedAt: null,
        rejectionReason: null,
      })
    }

    return { success: true }
  }

  async rejectSellerApplication(id: string, reason: string) {
    await this.db.collection('seller_applications').doc(id).update({
      status: 'REJECTED',
      rejectionReason: reason,
      reviewedAt: new Date().toISOString(),
    })
    return { success: true }
  }
}
