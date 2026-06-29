import { IsString, IsNumber, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SessionDetailsDto {
  @ApiProperty({
    example: 'Human Foundation',
    default: 'Human Foundation',
    description: 'The soul space type for the game session',
  })
  @IsNotEmpty()
  @IsString()
  soulSpace: string;

  @ApiProperty({
    example: 'Conflict Resolution',
    default: 'Conflict Resolution',
    description: 'The vibe or atmosphere for the session',
  })
  @IsNotEmpty()
  @IsString()
  vibe: string;

  @ApiProperty({
    example: 2,
    default: 2,
    description: 'Number of players participating in the session',
  })
  @IsNotEmpty()
  @IsNumber()
  noOfPlayers: number;

  @ApiProperty({
    example: 'Seeker',
    default: 'Seeker',
    description: 'Difficulty level of the game session',
  })
  @IsNotEmpty()
  @IsString()
  difficultyLevel: string;

  @ApiProperty({
    example: 'Reflective',
    default: 'Reflective',
    description: 'The engagement mode for the session',
  })
  @IsNotEmpty()
  @IsString()
  engagementMode: string;

  @ApiProperty({
    example: 'guided',
    default: 'guided',
    description: 'Type of engagement for the session',
  })
  @IsNotEmpty()
  @IsString()
  engagement: string;

  @ApiProperty({
    example: 5,
    default: 5,
    description: 'Number of questions in the session',
  })
  @IsNotEmpty()
  @IsNumber()
  noOfQuestions: number;

  @ApiProperty({
    example: false,
    default: false,
    description: 'Flag indicating if the session is live',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isLive?: boolean;
}
