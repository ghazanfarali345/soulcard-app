import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class MessageDto {
  @ApiProperty({
    example: 'user',
    description: 'Role of the message sender (user or model)',
  })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({
    example: 'Hello, how are you?',
    description: 'Content of the message',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class ChatDto {
  @ApiProperty({
    description: 'Array of messages for multi-turn conversation',
    type: [MessageDto],
    example: [
      { role: 'user', content: 'Hello' },
      { role: 'model', content: 'Hi there!' },
      { role: 'user', content: 'What can you do?' },
    ],
  })
  @IsArray({ message: 'Messages must be an array' })
  @IsNotEmpty({ message: 'Messages cannot be empty' })
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];
}
