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

  const conflictRules = `Conflict rules: Disagreement is encouraged. Debate the idea, not the person. Be blunt and clear; do not soften criticism. Argue strictly from your role's incentives. If a point is weak, say it plainly and why. Assume the founder is a beginner: explain why something is strong or weak, avoid jargon without explanation, frame guidance as learning.`;

  const roleContracts: Record<string, string> = {
    pm: 'You are the PM (sense-maker). Never answer domain questions first unless the intent is greeting or budget. After the primary expert responds, summarize the tension, translate trade-offs for a beginner founder, and present 2–3 clear options. Invite opposing viewpoints; do not force alignment.',
    developer: 'You are the Developer (feasibility realist). Separate easy-to-build from worth-building. Call out when something is trivial but strategically weak. Focus on feasibility, effort, tech choices, and opportunity cost.',
    ux: 'You are UX Research (problem reframer). Ask who/what pain/why. Reframe weak ideas into problem-led opportunities. Focus on validation, flows, and concrete user risks.',
    qa: 'You are QA (risk amplifier). Surface quality, maintenance, and scaling risks. Question whether the idea is worth maintaining long-term. If no major risk exists, say so briefly.',
    marketing: 'You are Marketing (idea killer). Be skeptical by default. Challenge market size, demand, and differentiation. Say when the idea has little or no market. Do not assume every idea can be marketed.',
  };

  const laneRule = roleContracts[baseRole] || `You are ${persona?.name || baseRole}. Stay strictly in your lane.`;

  return [
    `You are ${persona?.name || baseRole} (${baseRole}).`,
    conflictRules,
    laneRule,
    'If the user message is only a greeting with no request, give a brief acknowledgment; do not restate specs/scope/budget. Keep answers concise; avoid repetition of prior agent points.',
  ].join('\n');
};

type Intent = 'greeting' | 'market' | 'feasibility' | 'ux' | 'risk' | 'budget' | 'general';

const classifyIntent = (text: string): Intent => {
  const t = text.toLowerCase();
  if (/\b(hi|hello|hey|greetings)\b/.test(t)) return 'greeting';
  if (/(market|marketing|growth|4p|4ps|go to market|demand|traction|audience|pricing|positioning)/.test(t)) return 'market';
  if (/(feasible|feasibility|technical|tech|stack|api|build|implementation|performance|scal)/.test(t)) return 'feasibility';
  if (/(ux|ui|design|prototype|wireframe|flow|usability|user experience)/.test(t)) return 'ux';
  if (/(risk|qa|test|testing|bug|quality|regression|failure)/.test(t)) return 'risk';
  if (/(budget|cost|price|dollars|usd|spend|afford)/.test(t)) return 'budget';
  return 'general';
};

const intentToPersona: Record<Intent, string> = {
  greeting: 'pm',
  market: 'marketing',
  feasibility: 'developer',
  ux: 'ux',
  risk: 'qa',
  budget: 'pm',
  general: 'marketing',
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
  ): Promise<{ response: AgentResponse; usage: any } | null> {
    if (!this.openai) {
      throw new Error('OpenAI is not configured');
    }

    // Routing: determine primary persona from intent
    const intent = await this.classifyIntentSmart(userMessage || '');
    const primaryPersonaId = intentToPersona[intent];
    const personaId = persona?.id?.toLowerCase?.();

    const isPrimary = personaId === primaryPersonaId;
    const isPmFollowup = personaId === 'pm' && primaryPersonaId !== 'pm';

    // Enforce silence: if not primary and not PM follow-up, do not respond
    if (!isPrimary && !isPmFollowup) {
      return null;
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
                content: { type: 'string' },
                reasoning: { type: 'string' },
                confidence: { type: 'number' },
                suggestions: { type: 'array', items: { type: 'string' } },
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

  private async classifyIntentSmart(text: string): Promise<Intent> {
    const heuristic = classifyIntent(text);
    // If OpenAI is not available, or text is very short, return heuristic
    if (!this.openai || (text || '').trim().length < 3) {
      return heuristic;
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 32,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'intent_classification',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                intent: {
                  type: 'string',
                  enum: ['greeting', 'market', 'feasibility', 'ux', 'risk', 'budget', 'general'],
                },
              },
              required: ['intent'],
              additionalProperties: false,
            },
          },
        },
        messages: [
          {
            role: 'system',
            content:
              'Classify the user message intent for routing to a single advisor. Use one of: greeting, market, feasibility, ux, risk, budget, general. Keep it strict.',
          },
          { role: 'user', content: text },
        ],
      });

      const raw = completion.choices[0].message.content;
      const parsed = raw ? (JSON.parse(raw) as { intent?: Intent }) : null;
      if (parsed?.intent && intentToPersona[parsed.intent]) {
        return parsed.intent;
      }
    } catch (error) {
      this.logger.warn(`Intent classification fallback to heuristic: ${String(error)}`);
    }
    return heuristic;
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
