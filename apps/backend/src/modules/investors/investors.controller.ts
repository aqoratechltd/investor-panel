import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { InvestorsService } from './investors.service'
import { JwtAuthGuard } from '../../guards/jwt-auth.guard'

@ApiTags('Investors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('investors')
export class InvestorsController {
  constructor(private readonly investorsService: InvestorsService) {}
}
