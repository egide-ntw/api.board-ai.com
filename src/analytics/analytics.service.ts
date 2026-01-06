import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionAnalytics } from './entities/session-analytics.entity';
import { Conversation } from '../conversations/entities/conversation.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(SessionAnalytics)
    private analyticsRepository: Repository<SessionAnalytics>,
  ) {}

  async createOrUpdate(conversation: Conversation): Promise<SessionAnalytics> {
    let analytics = await this.analyticsRepository.findOne({
      where: { conversation: { id: conversation.id } },
    });

    if (!analytics) {
      analytics = this.analyticsRepository.create({
        conversation,
        agentParticipation: {},
      });
    }

    return this.analyticsRepository.save(analytics);
  }

  async updateTokens(
    conversationId: string,
    promptTokens: number,
    completionTokens: number,
  ): Promise<void> {
    const analytics = await this.analyticsRepository.findOne({
      where: { conversation: { id: conversationId } },
    });

    if (analytics) {
      analytics.promptTokens += promptTokens;
      analytics.completionTokens += completionTokens;
      analytics.totalTokens = analytics.promptTokens + analytics.completionTokens;
      
      // Rough cost estimation (GPT-4o pricing)
      const costPerPromptToken = 0.00000250; // $2.50 per 1M tokens
      const costPerCompletionToken = 0.00001000; // $10 per 1M tokens
      
      analytics.estimatedCost = Number((
        (analytics.promptTokens * costPerPromptToken) +
        (analytics.completionTokens * costPerCompletionToken)
      ).toFixed(4));

      await this.analyticsRepository.save(analytics);
    }
  }

  async incrementAgentParticipation(
    conversationId: string,
    agentType: string,
  ): Promise<void> {
    const analytics = await this.analyticsRepository.findOne({
      where: { conversation: { id: conversationId } },
    });

    if (analytics) {
      if (!analytics.agentParticipation) {
        analytics.agentParticipation = {};
      }

      analytics.agentParticipation[agentType] =
        (analytics.agentParticipation[agentType] || 0) + 1;

      await this.analyticsRepository.save(analytics);
    }
  }

  async findByConversation(conversationId: string): Promise<SessionAnalytics | null> {
    return this.analyticsRepository.findOne({
      where: { conversation: { id: conversationId } },
    });
  }
}
