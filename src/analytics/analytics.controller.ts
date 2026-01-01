import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';
import { ConversationsService } from '../conversations/conversations.service';

@ApiTags('Analytics')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
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
    @Request() req,
  ) {
    // Verify user owns the conversation
    await this.conversationsService.findOne(conversationId, req.user.id);

    const analytics =
      await this.analyticsService.findByConversation(conversationId);

    return {
      success: true,
      data: analytics,
    };
  }
}
