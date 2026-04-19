import { IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SessionDetailsDto {
  @ApiProperty({
    example: 'personal',
    description: 'The soul space type for the game session',
  })
  @IsNotEmpty()
  @IsString()
  soulSpace: string;

  @ApiProperty({
    example: 'relaxed',
    description: 'The vibe or atmosphere for the session',
  })
  @IsNotEmpty()
  @IsString()
  vibe: string;

  @ApiProperty({
    example: 2,
    description: 'Number of players participating in the session',
  })
  @IsNotEmpty()
  @IsNumber()
  noOfPlayers: number;

  @ApiProperty({
    example: 'medium',
    description: 'Difficulty level of the game session',
  })
  @IsNotEmpty()
  @IsString()
  difficultyLevel: string;

  @ApiProperty({
    example: 'competitive',
    description: 'The engagement mode for the session',
  })
  @IsNotEmpty()
  @IsString()
  engagementMode: string;

  @ApiProperty({
    example: 'deep',
    description: 'Type of engagement for the session',
  })
  @IsNotEmpty()
  @IsString()
  engagement: string;

  @ApiProperty({
    example: 10,
    description: 'Number of questions in the session',
  })
  @IsNotEmpty()
  @IsNumber()
  noOfQuestions: number;
}
