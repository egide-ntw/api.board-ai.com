import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface AgentResponse {
  content: string;
  reasoning: string;
  confidence: number;
  suggestions?: string[];
}

interface PersonaMeta {
  id: string;
  name?: string;
  role?: string;
}

const buildGuardrails = (persona?: PersonaMeta) => {
  const baseRole = persona?.id?.toLowerCase?.() || 'agent';

  const globalTagRules = `Non-negotiable tag protocol: If you are NOT tagged, do NOT respond. Never tag yourself. Never reply with only an @tag; always include substantive content. Always begin by acknowledging the tag (e.g., "@PM"). Reply only to the tagger's ask. No orphan messages: every message must be (a) a response to a tag, (b) a PM directive, or (c) a direct user answer. If you have nothing new, say "No further additions" exactly once.`;

  const roleContracts: Record<string, string> = {
    pm: 'You are the PM and orchestrator. Always tag exactly ONE role at a time. Never tag yourself. Never reply with only an @tag. Summarize/lock scope after each reply. Redirect user asks to the correct role via tagging. Drive decisions, scope, timeline, budget.',
    developer: 'You are the Developer. Speak ONLY when tagged. Address ONLY the person who tagged you. Provide feasibility, effort, trade-offs, tech choices, and risks. Do not ask new questions unless permitted.',
    ux: 'You are UX Research. Respond ONLY when tagged. Focus on usability, validation, flows, and risk reduction. Keep answers short and concrete.',
    qa: 'You are QA. Respond ONLY when tagged. Surface risks, edge cases, and test scope. If no major risk exists, say so.',
    marketing: 'You are Marketing. Respond ONLY when tagged. Base all answers on the finalized product scope. Do NOT repeat answers already given. Focus on positioning/channels/4Ps. No engineering talk.',
  };

  const laneRule = roleContracts[baseRole] || `You are ${persona?.name || baseRole}. Stay strictly in your lane.`;

  return [
    `You are ${persona?.name || baseRole} (${baseRole}).`,
    globalTagRules,
    laneRule,
    'Do not repeat points made in the last 6 messages; add net-new insight or decisions. If your response would overlap with any of the last 3 agent messages (similar topic or wording), reply only with "No further additions".',
  ].join('\n');
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
      });
    } else {
      this.logger.warn('OpenAI API key not configured. AI features will be disabled.');
    }
  }

  async generateAgentResponse(
    systemPrompt: string,
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    persona?: PersonaMeta,
  ): Promise<{ response: AgentResponse; usage: any }> {
    if (!this.openai) {
      throw new Error('OpenAI is not configured');
    }

    const personaGuardrails = buildGuardrails(persona);

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: personaGuardrails },
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(
        (msg) =>
          ({
            role: msg.role === 'agent' ? 'assistant' : (msg.role as any),
            content: msg.content,
          }) as OpenAI.ChatCompletionMessageParam,
      ),
      { role: 'user', content: userMessage },
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'agent_response',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'The main response content from the agent',
                },
                reasoning: {
                  type: 'string',
                  description: 'The reasoning behind the agents perspective',
                },
                confidence: {
                  type: 'number',
                  description: 'Confidence level from 0 to 1',
                },
                suggestions: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Optional actionable suggestions',
                },
              },
              required: ['content', 'reasoning', 'confidence', 'suggestions'],
              additionalProperties: false,
            },
          },
        },
        temperature: 0.6,
        max_tokens: 400,
      });

      const responseContent = completion.choices[0].message.content;
      const parsed: AgentResponse = JSON.parse(responseContent || '{}');

      return {
        response: parsed,
        usage: completion.usage,
      };
    } catch (error) {
      this.logger.error('Error generating agent response:', error);
      throw error;
    }
  }

  async generateSummary(messages: string[]): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI is not configured');
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Summarize the following agent discussion into a clear, concise summary highlighting key points and decisions.',
          },
          {
            role: 'user',
            content: messages.join('\n\n'),
          },
        ],
        temperature: 0.5,
        max_tokens: 300,
      });

      return completion.choices[0].message.content || '';
    } catch (error) {
      this.logger.error('Error generating summary:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return this.openai !== null;
  }
}
