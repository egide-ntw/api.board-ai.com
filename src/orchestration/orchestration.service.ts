import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AiService } from '../ai/ai.service';
import { PersonasService } from '../personas/personas.service';
import { MessagesService } from '../messages/messages.service';
import { ConversationsService } from '../conversations/conversations.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { BoardGateway } from '../board/board.gateway';
import { Conversation, ConversationStatus } from '../conversations/entities/conversation.entity';
import { Message } from '../messages/entities/message.entity';
import { Persona } from '../personas/entities/persona.entity';

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

  private async handlePersonaResponse(
    conversation: Conversation,
    persona: Persona,
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    conversationId: string,
    agentResponses: Message[],
    responded: Set<string>,
    turnIndex: number,
  ): Promise<void> {
    try {
      this.boardGateway.emitAgentTypingStart(conversationId, persona.id, persona.name);

      await this.delayRange(1500, 3000);

      const result = await this.aiService.generateAgentResponse(
        persona.systemPrompt,
        userMessage,
        conversationHistory,
        { id: persona.id, name: persona.name, role: persona.description },
      );

      // Silence: non-routed personas return null; skip processing
      if (!result) {
        this.boardGateway.emitAgentTypingStop(conversationId, persona.id, persona.name);
        return;
      }

      const { response, usage } = result;

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
      responded.add(persona.id);

      const messagePayload = {
        id: agentMessage.id || randomUUID(),
        conversationId,
        agentId: persona.id,
        agentName: persona.name,
        content: agentMessage.content,
        createdAt: agentMessage.createdAt,
      };

      this.boardGateway.emitAgentMessage(conversationId, messagePayload);
      this.boardGateway.emitAgentTypingStop(conversationId, persona.id, persona.name);

      await this.analyticsService.updateTokens(
        conversationId,
        usage?.prompt_tokens || 0,
        usage?.completion_tokens || 0,
      );

      await this.analyticsService.incrementAgentParticipation(
        conversationId,
        persona.id,
      );

      await this.conversationsService.update(conversationId, {
        currentSpeaker: persona.id,
        turnIndex,
      } as any);
    } catch (error) {
      this.logger.error(`Error processing ${persona.name} response:`, error);
    }
  }

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
    const conversationHistory = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const pmPersona = personas.find((p) => p.id === 'pm') || null;
    const taggedPersonas = this.extractTaggedPersonas(personas, userMessage);
    const primaryFromTag = taggedPersonas.length > 0 ? taggedPersonas[0] : null;

    // Primary selection: tag override -> AI router -> heuristic fallback
    let primaryPersona: Persona | null = primaryFromTag;

    if (!primaryPersona) {
      primaryPersona = await this.choosePersonaByPrompt(personas, userMessage);
    }

    if (!primaryPersona) {
      const intent = this.classifyIntentLocal(userMessage || '');
      const intentMap: Record<string, string> = {
        greeting: 'pm',
        market: 'marketing',
        feasibility: 'developer',
        ux: 'ux',
        risk: 'qa',
        budget: 'pm',
        general: 'marketing',
      };

      const primaryId = intentMap[intent];
      primaryPersona = personas.find((p) => p.id === primaryId) || pmPersona || personas[0];
    }

    let turnIndex = conversation.turnIndex || 0;
    const responded = new Set<string>();

    // Primary responds
    if (primaryPersona) {
      await this.handlePersonaResponse(
        conversation,
        primaryPersona,
        userMessage,
        conversationHistory,
        conversationId,
        agentResponses,
        responded,
        turnIndex,
      );
      turnIndex += 1;
    }

    // PM follow-up only if not already primary
    if (pmPersona && primaryPersona && pmPersona.id !== primaryPersona.id) {
      await this.handlePersonaResponse(
        conversation,
        pmPersona,
        userMessage,
        conversationHistory,
        conversationId,
        agentResponses,
        responded,
        turnIndex,
      );
      turnIndex += 1;
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
    // Step mechanism retired to avoid user confusion; keep signature but no-op.
    this.logger.warn(`stepConversationTurn is deprecated and returns no message for conversation ${conversationId}`);
    return { speaker: null, message: null };
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

  private delayRange(minMs: number, maxMs: number): Promise<void> {
    const span = Math.max(maxMs - minMs, 0);
    const jitter = Math.random() * span;
    return this.delay(minMs + jitter);
  }

  private selectPersonaForMessage(personas: Persona[], userMessage: string): Persona | null {
    if (!personas.length) {
      return null;
    }

    const text = userMessage.toLowerCase();

    const keywordBuckets: Record<string, string[]> = {
      developer: [
        'api',
        'endpoint',
        'integration',
        'schema',
        'sql',
        'database',
        'query',
        'migration',
        'code',
        'typescript',
        'nest',
        'test',
        'testing',
        'qa',
        'quality assurance',
        'unit',
        'integration test',
        'e2e',
        'cicd',
        'pipeline',
        'automation',
        'jest',
        'unit test',
        'bug',
        'stack trace',
        'error',
        'log',
        'debug',
        'architecture',
        'design doc',
        'diagram',
      ],
      pm: [
        'pm',
        'product manager',
        'product management',
        'roadmap',
        'requirements',
        'scope',
        'milestone',
        'timeline',
        'tradeoff',
        'prioritize',
        'backlog',
        'ticket',
        'story',
        'sprint',
        'acceptance criteria',
        'launch',
        'rollout',
        'go to market',
      ],
      marketing: [
        'campaign',
        'landing page',
        'copy',
        'seo',
        'ad',
        'funnel',
        'conversion',
        'engagement',
        'cta',
        'audience',
        'positioning',
        'go to market',
      ],
      design: [
        'ui',
        'ux',
        'mock',
        'figma',
        'prototype',
        'interaction',
        'accessibility',
        'responsive',
        'visual',
        'layout',
        'color',
        'typography',
      ],
      legal: [
        'contract',
        'terms',
        'privacy',
        'gdpr',
        'ccpa',
        'compliance',
        'license',
        'nda',
      ],
      finance: [
        'budget',
        'pricing',
        'cost',
        'margin',
        'roi',
        'revenue',
        'expense',
        'invoice',
        'forecast',
      ],
    };

    const personaCategoryScore = (persona: Persona): number => {
      let score = 0;
      const idName = `${persona.id} ${persona.name} ${persona.description || ''}`.toLowerCase();

      const bumpIfIncludes = (category: string, weight: number) => {
        if (idName.includes(category)) {
          score += weight;
        }
      };

      bumpIfIncludes('developer', 2);
      bumpIfIncludes('engineer', 2);
      bumpIfIncludes('marketing', 2);
      bumpIfIncludes('growth', 1);
      bumpIfIncludes('design', 2);
      bumpIfIncludes('product', 2);
      bumpIfIncludes('pm', 2);
      bumpIfIncludes('legal', 2);
      bumpIfIncludes('finance', 2);

      const capabilities = (persona.capabilities || []).map((c) => c.toLowerCase());
      const addCapabilityScore = (cap: string, weight: number) => {
        if (capabilities.some((c) => c.includes(cap))) {
          score += weight;
        }
      };

      addCapabilityScore('api', 1);
      addCapabilityScore('code', 1);
      addCapabilityScore('sql', 1);
      addCapabilityScore('marketing', 1);
      addCapabilityScore('growth', 1);
      addCapabilityScore('ux', 1);
      addCapabilityScore('ui', 1);
      addCapabilityScore('qa', 2);
      addCapabilityScore('test', 2);
      addCapabilityScore('testing', 2);
      addCapabilityScore('quality', 1);
      addCapabilityScore('automation', 1);
      addCapabilityScore('pm', 3);
      addCapabilityScore('product', 3);
      addCapabilityScore('roadmap', 2);
      addCapabilityScore('requirements', 2);
      addCapabilityScore('legal', 1);
      addCapabilityScore('compliance', 1);
      addCapabilityScore('finance', 1);

      Object.entries(keywordBuckets).forEach(([category, keywords]) => {
        keywords.forEach((keyword) => {
          if (text.includes(keyword)) {
            if (category === 'developer' && (idName.includes('dev') || idName.includes('engineer'))) {
              score += 3;
            } else if (category === 'marketing' && idName.includes('marketing')) {
              score += 3;
            } else if (category === 'design' && idName.includes('design')) {
              score += 3;
            } else if (category === 'pm' && (idName.includes('pm') || idName.includes('product'))) {
              score += 3;
            } else if (category === 'legal' && idName.includes('legal')) {
              score += 3;
            } else if (category === 'finance' && idName.includes('finance')) {
              score += 3;
            } else {
              score += 1;
            }
          }
        });
      });

      return score;
    };

    let bestPersona: Persona | null = null;
    let bestScore = -1;

    for (const persona of personas) {
      const score = personaCategoryScore(persona);

      if (score > bestScore) {
        bestScore = score;
        bestPersona = persona;
      }
    }

    // If everything tied at 0, stick with the first persona to avoid empty handoff
    if (bestScore <= 0) {
      return personas[0] || null;
    }

    return bestPersona;
  }

  private async choosePersonaByPrompt(personas: Persona[], userMessage: string): Promise<Persona | null> {
    if (!personas.length) {
      return null;
    }

    const roster = personas
      .map((p, idx) => {
        const caps = (p.capabilities || []).join(', ');
        return `${idx + 1}. id=${p.id} name=${p.name} desc=${p.description || ''} capabilities=${caps}`;
      })
      .join('\n');

    const selectionPrompt =
      'You are a routing agent. Given a user message and a list of personas, pick the single best persona to answer. Strongly prefer a Product Manager/PM persona for planning, coordination, requirements, or when the user mentions PM/product. Only choose Developer when the ask is clearly code/architecture/testing; choose Designer only for UX/UI/visual asks. Respond with ONLY a JSON object like {"personaId":"<id>"}.';

    try {
      const result = await this.aiService.generateAgentResponse(
        selectionPrompt,
        `User message: ${userMessage}\n\nPersonas:\n${roster}\n\nReturn JSON with personaId.`,
        [],
      );

      if (!result) {
        return null;
      }

      const { response } = result;

      const content = response.content || '';
      const parsed = JSON.parse(content.trim());
      const personaId = parsed?.personaId as string | undefined;

      if (!personaId) {
        return null;
      }

      return personas.find((p) => p.id === personaId) || null;
    } catch (error) {
      this.logger.warn('Router prompt failed, falling back to heuristic routing', error as any);
      return null;
    }
  }

  private extractTaggedPersonas(personas: Persona[], userMessage: string): Persona[] {
    const tags = Array.from(userMessage.matchAll(/@([\w-]+)/g)).map((m) => m[1].toLowerCase());
    if (!tags.length) return [];

    return personas.filter((p) => {
      const idName = `${p.id} ${p.name}`.toLowerCase();
      return tags.some((t) => idName.includes(t));
    });
  }

  // Lightweight local intent classifier to mirror AiService mapping
  private classifyIntentLocal(message: string): string {
    const text = message.toLowerCase();

    if (/\b(hi|hello|hey)\b/.test(text)) return 'greeting';
    if (/market|positioning|launch|growth|segment/.test(text)) return 'market';
    if (/build|feasible|architecture|scal(ing|able)|perf(ormance)?/.test(text)) return 'feasibility';
    if (/ux|ui|design|flow|usability|prototype/.test(text)) return 'ux';
    if (/risk|qa|test|bug|regression|quality/.test(text)) return 'risk';
    if (/budget|cost|pricing/.test(text)) return 'budget';
    return 'general';
  }
}
