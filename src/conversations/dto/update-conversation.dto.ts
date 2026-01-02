import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, IsInt, Min } from 'class-validator';
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

  @ApiPropertyOptional({ example: ['marketing', 'developer', 'designer'] })
  @IsArray()
  @IsOptional()
  activePersonas?: string[];

  @ApiPropertyOptional({ example: 'designer' })
  @IsString()
  @IsOptional()
  currentSpeaker?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsInt()
  @Min(0)
  @IsOptional()
  turnIndex?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxRounds?: number;
}
