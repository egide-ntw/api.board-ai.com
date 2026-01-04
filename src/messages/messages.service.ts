import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageRole } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { Conversation } from '../conversations/entities/conversation.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async create(
    conversationId: string,
    createDto: CreateMessageDto,
    conversation: Conversation,
  ): Promise<Message> {
    const message = this.messagesRepository.create({
      conversation,
      role: MessageRole.USER,
      content: createDto.content,
      roundNumber: conversation.currentRound,
    });

    return this.messagesRepository.save(message);
  }

  async createAgentMessage(
    conversation: Conversation,
    agentType: string,
    content: string,
    structuredOutput?: any,
  ): Promise<Message> {
    const message = this.messagesRepository.create({
      conversation,
      role: MessageRole.AGENT,
      agentType: agentType as any,
      content,
      structuredOutput,
      roundNumber: conversation.currentRound,
    });

    return this.messagesRepository.save(message);
  }

  async findAllByConversation(conversationId: string): Promise<Message[]> {
    return this.messagesRepository.find({
      where: { conversation: { id: conversationId } },
      order: { createdAt: 'ASC' },
      relations: ['attachments'],
    });
  }

  async findOne(id: string): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id },
      relations: ['conversation', 'attachments'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }
}
