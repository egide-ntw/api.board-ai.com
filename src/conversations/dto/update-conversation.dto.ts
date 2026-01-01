import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ConversationStatus } from '../entities/conversation.entity';

export class UpdateConversationDto {
  @ApiPropertyOptional({ example: 'Updated Title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ enum: ConversationStatus })
  @IsEnum(ConversationStatus)
  @IsOptional()
  status?: ConversationStatus;
}
