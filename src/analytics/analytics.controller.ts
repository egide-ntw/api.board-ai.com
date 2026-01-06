import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';
import { ConversationsService } from '../conversations/conversations.service';

@ApiTags('Analytics')
@Controller({
  path: 'analytics',
  version: '1',
})
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly conversationsService: ConversationsService,
  ) {}

  @Get('conversations/:id')
  async getConversationAnalytics(
    @Param('id') conversationId: string,
  ) {
    // Verify conversation exists
    await this.conversationsService.findOne(conversationId);

    const analytics =
      await this.analyticsService.findByConversation(conversationId);

    return {
      success: true,
      data: analytics,
    };
  }
}
