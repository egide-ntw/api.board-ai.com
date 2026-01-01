import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, ConversationStatus } from './entities/conversation.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { User } from '../users/entities/user.entity';
import { IPaginationOptions } from '../utils/types/pagination-options';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
  ) {}

  async create(
    createDto: CreateConversationDto,
    user?: User,
  ): Promise<Conversation> {
    const conversation = this.conversationsRepository.create({
      ...createDto,
      user: user || null,
      title: createDto.title || 'New Conversation',
      activePersonas: createDto.activePersonas || [
        'marketing',
        'developer',
        'designer',
      ],
      maxRounds: createDto.maxRounds || 3,
      status: ConversationStatus.ACTIVE,
    });

    return this.conversationsRepository.save(conversation);
  }

  async findAll(
    paginationOptions: IPaginationOptions,
  ): Promise<{ data: Conversation[]; total: number }> {
    const [data, total] = await this.conversationsRepository.findAndCount({
      order: { updatedAt: 'DESC' },
      take: paginationOptions.limit,
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      relations: ['messages'],
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findOne({
      where: { id },
      relations: ['messages', 'messages.attachments'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async update(
    id: string,
    updateConversationDto: UpdateConversationDto,
  ): Promise<Conversation> {
    const conversation = await this.findOne(id);

    Object.assign(conversation, updateConversationDto);

    return this.conversationsRepository.save(conversation);
  }

  async remove(id: string): Promise<void> {
    const conversation = await this.findOne(id);
    await this.conversationsRepository.remove(conversation);
  }

  async incrementRound(id: string): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findOne({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    conversation.currentRound += 1;

    if (conversation.currentRound >= conversation.maxRounds) {
      conversation.status = ConversationStatus.COMPLETED;
    }

    return this.conversationsRepository.save(conversation);
  }
}
