import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@ApiTags('Conversations')
@Controller({
  path: 'conversations',
  version: '1',
})
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new conversation',
    description: 'Initialize a new boardroom conversation with selected AI personas'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Conversation created successfully',
    schema: {
      example: {
        id: 'uuid',
        title: 'Marketing Campaign Discussion',
        status: 'active',
        activePersonas: ['marketing', 'developer', 'designer'],
        maxRounds: 3,
        currentRound: 0
      }
    }
  })
  create(@Body() createDto: CreateConversationDto, @Request() req) {
    return this.conversationsService.create(createDto, req?.user);
  }

  @Get()
  @ApiOperation({ 
    summary: 'List all conversations',
    description: 'Get paginated list of user conversations ordered by most recent'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Conversations retrieved successfully'
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const { data, total } = await this.conversationsService.findAll(
      {
        page,
        limit,
      },
    );

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateConversationDto,
  ) {
    return this.conversationsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.conversationsService.remove(id);
  }
}
