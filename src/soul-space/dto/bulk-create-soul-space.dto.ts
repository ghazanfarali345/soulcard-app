import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSoulSpaceDto } from './create-soul-space.dto';

export class BulkCreateSoulSpaceDto {
  @ApiProperty({ type: [CreateSoulSpaceDto], description: 'An array of soul spaces to create' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSoulSpaceDto)
  data: CreateSoulSpaceDto[];
}
