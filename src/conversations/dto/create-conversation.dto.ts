import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsInt, Min, Max } from 'class-validator';

export class CreateConversationDto {
  @ApiPropertyOptional({ example: 'Marketing Campaign Discussion' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Discuss Q1 marketing strategy' })
  @IsString()
  @IsOptional()
  context?: string;

  @ApiPropertyOptional({ example: ['marketing', 'developer', 'designer'] })
  @IsArray()
  @IsOptional()
  activePersonas?: string[];

  @ApiPropertyOptional({ example: 'marketing' })
  @IsString()
  @IsOptional()
  currentSpeaker?: string;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  turnIndex?: number;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  maxRounds?: number;
}
