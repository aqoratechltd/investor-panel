import { Controller, Get, Patch, Body, Param } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AdminService } from './admin.service'

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('businesses')
  getBusinesses() {
    return this.adminService.getBusinesses()
  }

  @Patch('businesses/:id/approve')
  approveBusiness(@Param('id') id: string) {
    return this.adminService.approveBusiness(id)
  }

  @Patch('businesses/:id/reject')
  rejectBusiness(@Param('id') id: string, @Body('reason') reason: string) {
    return this.adminService.rejectBusiness(id, reason)
  }

  @Get('seller-applications')
  getSellerApplications() {
    return this.adminService.getSellerApplications()
  }

  @Patch('seller-applications/:id/approve')
  approveSellerApplication(@Param('id') id: string) {
    return this.adminService.approveSellerApplication(id)
  }

  @Patch('seller-applications/:id/reject')
  rejectSellerApplication(@Param('id') id: string, @Body('reason') reason: string) {
    return this.adminService.rejectSellerApplication(id, reason)
  }
}
