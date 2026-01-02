import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { PersonasService } from '../personas/personas.service';
import { MessagesService } from '../messages/messages.service';
import { ConversationsService } from '../conversations/conversations.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { BoardGateway } from '../board/board.gateway';
import { Conversation, ConversationStatus } from '../conversations/entities/conversation.entity';
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
    userId?: number,
  ): Promise<Message[]> {
    const conversation =
      await this.conversationsService.findOne(conversationId);

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

  async stepConversationTurn(conversationId: string): Promise<{
    speaker: string | null;
    message: Message | null;
  }> {
    const conversation = await this.conversationsService.findOne(conversationId);
    const personas = await this.personasService.findByIds(
      conversation.activePersonas,
    );

    if (!personas.length) {
      this.logger.warn(`No personas configured for conversation ${conversationId}`);
      return { speaker: null, message: null };
    }

    const speakerIndex = conversation.turnIndex % personas.length;
    const speaker = personas[speakerIndex];

    // Emit typing indicator for the selected agent
    this.boardGateway.emitAgentTyping(conversationId, speaker.id);

    const history = await this.messagesService.findAllByConversation(
      conversationId,
    );
    const conversationHistory = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const { response, usage } = await this.aiService.generateAgentResponse(
      speaker.systemPrompt,
      'Continue the deliberation toward a concrete plan, considering prior turns and uploaded context.',
      conversationHistory,
    );

    const agentMessage = await this.messagesService.createAgentMessage(
      conversation,
      speaker.id,
      response.content,
      {
        reasoning: response.reasoning,
        confidence: response.confidence,
        suggestions: response.suggestions,
      },
    );

    await this.analyticsService.updateTokens(
      conversationId,
      usage?.prompt_tokens || 0,
      usage?.completion_tokens || 0,
    );

    await this.analyticsService.incrementAgentParticipation(
      conversationId,
      speaker.id,
    );

    conversation.currentSpeaker = speaker.id;
    conversation.turnIndex += 1;

    // Advance round when every persona has spoken
    const completedRounds = Math.floor(conversation.turnIndex / personas.length);
    conversation.currentRound = completedRounds;
    if (conversation.currentRound >= conversation.maxRounds) {
      conversation.status = ConversationStatus.COMPLETED;
    }

    await this.conversationsService.update(conversation.id, {
      currentSpeaker: conversation.currentSpeaker,
      turnIndex: conversation.turnIndex,
      currentRound: conversation.currentRound,
      status: conversation.status,
    } as any);

    this.boardGateway.emitAgentResponse(conversationId, agentMessage);

    return { speaker: speaker.id, message: agentMessage };
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
