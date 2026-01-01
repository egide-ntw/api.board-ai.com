import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { PersonasService } from '../personas/personas.service';
import { MessagesService } from '../messages/messages.service';
import { ConversationsService } from '../conversations/conversations.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { BoardGateway } from '../board/board.gateway';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Message } from '../messages/entities/message.entity';

@Injectable()
export class OrchestrationService {
  private readonly logger = new Logger(OrchestrationService.name);

  constructor(
    private aiService: AiService,
    private personasService: PersonasService,
    private messagesService: MessagesService,
    private conversationsService: ConversationsService,
    private analyticsService: AnalyticsService,
    private boardGateway: BoardGateway,
  ) {}

  async processUserMessage(
    conversationId: string,
    userMessage: string,
    userId: number,
  ): Promise<Message[]> {
    const conversation =
      await this.conversationsService.findOne(conversationId, userId);

    // Get active personas
    const personas = await this.personasService.findByIds(
      conversation.activePersonas,
    );

    // Get conversation history
    const history =
      await this.messagesService.findAllByConversation(conversationId);

    const agentResponses: Message[] = [];

    // Process each agent response sequentially
    for (const persona of personas) {
      try {
        // Emit typing indicator
        this.boardGateway.emitAgentTyping(conversationId, persona.id);

        // Build conversation history for this agent
        const conversationHistory = history.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        // Generate response
        const { response, usage } = await this.aiService.generateAgentResponse(
          persona.systemPrompt,
          userMessage,
          conversationHistory,
        );

        // Create agent message
        const agentMessage = await this.messagesService.createAgentMessage(
          conversation,
          persona.id,
          response.content,
          {
            reasoning: response.reasoning,
            confidence: response.confidence,
            suggestions: response.suggestions,
          },
        );

        agentResponses.push(agentMessage);

        // Update analytics
        await this.analyticsService.updateTokens(
          conversationId,
          usage?.prompt_tokens || 0,
          usage?.completion_tokens || 0,
        );

        await this.analyticsService.incrementAgentParticipation(
          conversationId,
          persona.id,
        );

        // Emit agent response via WebSocket
        this.boardGateway.emitAgentResponse(conversationId, agentMessage);

        // Small delay between agents for better UX
        await this.delay(1000);
      } catch (error) {
        this.logger.error(
          `Error processing ${persona.name} response:`,
          error,
        );
      }
    }

    // Increment round
    await this.conversationsService.incrementRound(conversationId);

    // Emit round completed
    this.boardGateway.emitRoundCompleted(
      conversationId,
      conversation.currentRound + 1,
    );

    return agentResponses;
  }

  async generateDiscussionSummary(conversationId: string): Promise<string> {
    const messages =
      await this.messagesService.findAllByConversation(conversationId);

    const messageContents = messages
      .filter((msg) => msg.role === 'agent')
      .map((msg) => `${msg.agentType}: ${msg.content}`);

    if (messageContents.length === 0) {
      return 'No discussion to summarize yet.';
    }

    return this.aiService.generateSummary(messageContents);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
