import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface AgentResponse {
  content: string;
  reasoning: string;
  confidence: number;
  suggestions?: string[];
}

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
  ): Promise<{ response: AgentResponse; usage: any }> {
    if (!this.openai) {
      throw new Error('OpenAI is not configured');
    }

    const messages: OpenAI.ChatCompletionMessageParam[] = [
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
