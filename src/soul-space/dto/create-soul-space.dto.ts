import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ArrayNotEmpty, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class VibeDto {
  @ApiProperty({ example: 'Calm', description: 'The name of the vibe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'A state of tranquility and peace.', description: 'The description of the vibe' })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class CreateSoulSpaceDto {
  @ApiProperty({ example: 'Zen Garden', description: 'The name of the soul space' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: [VibeDto], description: 'A list of vibes with their descriptions' })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => VibeDto)
  vibes: VibeDto[];
}
