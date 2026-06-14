import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserStatusDto {
  @ApiProperty({ description: "User status to set", example: 'inactive' })
  @IsIn(['active', 'inactive'])
  status: 'active' | 'inactive';
}
