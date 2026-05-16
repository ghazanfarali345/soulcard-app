import { Module, Global } from '@nestjs/common';
import { ResendService } from './resend.service';
import { NodemailerService } from './nodemailer.service';

@Global()
@Module({
  providers: [ResendService, NodemailerService],
  exports: [ResendService, NodemailerService],
})
export class EmailModule {}
