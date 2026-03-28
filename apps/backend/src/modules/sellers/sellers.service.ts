import { Injectable, InternalServerErrorException } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'

interface UploadedFile {
  originalname: string
  mimetype: string
  buffer: Buffer
}

@Injectable()
export class SellersService {
  async uploadPlStatement(file: UploadedFile, uid: string): Promise<string> {
    try {
      const ext = file.originalname.split('.').pop()
      const dir = path.join(process.cwd(), 'uploads', 'seller_pnl', uid)
      fs.mkdirSync(dir, { recursive: true })

      const filename = `pl_statement.${ext}`
      const filepath = path.join(dir, filename)
      fs.writeFileSync(filepath, file.buffer)

      const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`
      return `${baseUrl}/uploads/seller_pnl/${uid}/${filename}`
    } catch (err: any) {
      throw new InternalServerErrorException('File upload failed: ' + err.message)
    }
  }
}
