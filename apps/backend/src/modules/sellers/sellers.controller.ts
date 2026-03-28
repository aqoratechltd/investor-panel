import {
  Controller, Post, UploadedFile, UseInterceptors, Body, BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiConsumes } from '@nestjs/swagger'
import { SellersService } from './sellers.service'

@ApiTags('Sellers')
@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Post('upload-pl')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadPlStatement(
    @UploadedFile() file: any,
    @Body('uid') uid: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded')
    if (!uid) throw new BadRequestException('uid is required')
    const url = await this.sellersService.uploadPlStatement(file, uid)
    return { url }
  }
}
