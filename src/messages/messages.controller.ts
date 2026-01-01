import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ConversationsService } from '../conversations/conversations.service';

@ApiTags('Messages')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'conversations/:conversationId/messages',
  version: '1',
})
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly conversationsService: ConversationsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('conversationId') conversationId: string,
    @Body() createDto: CreateMessageDto,
    @Request() req,
  ) {
    const conversation = await this.conversationsService.findOne(
      conversationId,
      req.user.id,
    );

    const message = await this.messagesService.create(
      conversationId,
      createDto,
      conversation,
    );

    return {
      success: true,
      data: message,
    };
  }

  @Get()
  async findAll(
    @Param('conversationId') conversationId: string,
    @Request() req,
  ) {
    // Verify user has access to conversation
    await this.conversationsService.findOne(conversationId, req.user.id);

    const messages =
      await this.messagesService.findAllByConversation(conversationId);

    return {
      success: true,
      data: messages,
      total: messages.length,
    };
  }
}
