import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  ArrayNotEmpty,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class VibeDto {
  @ApiProperty({ example: 'Calm', description: 'The name of the vibe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'A state of tranquility and peace.',
    description: 'The description of the vibe',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class CreateSoulSpaceDto {
  @ApiProperty({
    example: 'Zen Garden',
    description: 'The name of the soul space',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '/uploads/soul-space-icons/sun.png',
    description: 'URL of the uploaded icon',
    required: false,
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({
    type: [VibeDto],
    description: 'A list of vibes with their descriptions',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => VibeDto)
  vibes: VibeDto[];
}

export class CreateSoulSpaceUploadDto {
  @ApiProperty({
    example: 'Zen Garden',
    description: 'The name of the soul space',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Upload an icon file for the soul space',
    required: false,
  })
  @IsOptional()
  icon?: any;

  @ApiProperty({
    example: '[{"name":"Calm","description":"Peaceful"}]',
    description: 'JSON-encoded array of vibes',
  })
  @IsString()
  @IsNotEmpty()
  vibes: string;
}

export class UpdateSoulSpaceUploadDto {
  @ApiProperty({
    example: 'Zen Garden',
    description: 'The name of the soul space',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  name?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Upload an icon file for the soul space',
    required: false,
  })
  @IsOptional()
  icon?: any;

  @ApiProperty({
    example: '[{"name":"Calm","description":"Peaceful"}]',
    description: 'JSON-encoded array of vibes',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  vibes?: string;
}
