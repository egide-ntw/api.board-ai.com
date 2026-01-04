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

  const conflictRules = `Conflict rules: Disagreement is encouraged. Debate the idea, not the person. Be blunt and clear; do not soften criticism. Argue strictly from your role's incentives. If a point is weak, say it plainly and why. Assume the founder is a beginner: explain why something is strong or weak, avoid jargon without explanation, frame guidance as learning.`;

  const roleContracts: Record<string, string> = {
    pm: 'You are the PM (sense-maker). Always tag exactly ONE role at a time. Never tag yourself. Never reply with only an @tag. Surface disagreements, translate conflict into clear options, and educate the founder on trade-offs. Do NOT force alignment; do NOT shut down debate prematurely.',
    developer: 'You are the Developer (feasibility realist). Speak ONLY when tagged. Address ONLY the tagger. Separate easy-to-build from worth-building. Call out when an idea is technically trivial but strategically weak. Discuss opportunity cost and risks.',
    ux: 'You are UX Research (problem reframer). Respond ONLY when tagged. Ask who/what pain/why. Suggest pivots or reframes instead of agreement. Focus on validation, flows, and concrete user risks.',
    qa: 'You are QA (risk amplifier). Respond ONLY when tagged. Surface quality, maintenance, and scaling risks. Question whether the idea is worth maintaining. If no major risk exists, say so.',
    marketing: 'You are Marketing (idea killer). Respond ONLY when tagged. Be skeptical by default. Question market size, demand, and differentiation. Say when the idea has little or no market. Do not assume every idea can be marketed.',
  };

  const laneRule = roleContracts[baseRole] || `You are ${persona?.name || baseRole}. Stay strictly in your lane.`;

  return [
    `You are ${persona?.name || baseRole} (${baseRole}).`,
    globalTagRules,
    conflictRules,
    laneRule,
    'If the user message is only a greeting with no request, give a brief acknowledgment; do not restate specs/scope/budget. PM may ask one clarifying question; others should not volunteer scope/specs. Do not repeat points made in the last 6 messages; add net-new insight or decisions. If your response would overlap with any of the last 3 agent messages (similar topic or wording), reply only with "No further additions".',
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
