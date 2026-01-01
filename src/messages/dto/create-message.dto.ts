import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: 'What is the best marketing strategy for Q1?' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: ['file-uuid-1', 'file-uuid-2'] })
  @IsArray()
  @IsOptional()
  attachmentIds?: string[];
}
