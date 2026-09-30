import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ResultVisibilityDto {
  @ApiProperty({
    example: true,
    description:
      "Whether other members of this session may view this participant's results",
  })
  @IsBoolean()
  shareResults: boolean;
}
