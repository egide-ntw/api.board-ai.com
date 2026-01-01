import { Controller, Post, Param, Body, UseGuards, Get, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OrchestrationService } from './orchestration.service';

@ApiTags('Orchestration')
@Controller({
  path: 'orchestration',
  version: '1',
})
export class OrchestrationController {
  constructor(
    private readonly orchestrationService: OrchestrationService,
  ) {}

  @Post('conversations/:id/process')
  @ApiOperation({ 
    summary: 'Process user message and get agent responses',
    description: 'Send a message to the conversation and trigger all active AI personas to respond in sequence. This is the main entry point for the multi-agent debate.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Agent responses generated successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 'msg-uuid',
            role: 'agent',
            agentType: 'marketing',
            content: 'From a marketing perspective...',
            structuredOutput: {
              reasoning: 'Based on market trends...',
              confidence: 0.85,
              suggestions: ['Focus on digital channels', 'Target Gen Z audience']
            }
          }
        ],
        count: 3
      }
    }
  })
  async processMessage(
    @Param('id') conversationId: string,
    @Body('message') message: string,
    @Request() req?,
  ) {
    const responses =
      await this.orchestrationService.processUserMessage(conversationId, message, req?.user?.id);

    return {
      success: true,
      data: responses,
      count: responses.length,
    };
  }

  @Get('conversations/:id/summary')
  async generateSummary(@Param('id') conversationId: string) {
    const summary =
      await this.orchestrationService.generateDiscussionSummary(conversationId);

    return {
      success: true,
      data: { summary },
    };
  }
}
