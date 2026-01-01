import { Module } from '@nestjs/common';
import { OrchestrationService } from './orchestration.service';
import { OrchestrationController } from './orchestration.controller';
import { AiModule } from '../ai/ai.module';
import { PersonasModule } from '../personas/personas.module';
import { MessagesModule } from '../messages/messages.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { BoardModule } from '../board/board.module';

@Module({
  imports: [
    AiModule,
    PersonasModule,
    MessagesModule,
    ConversationsModule,
    AnalyticsModule,
    BoardModule,
  ],
  controllers: [OrchestrationController],
  providers: [OrchestrationService],
  exports: [OrchestrationService],
})
export class OrchestrationModule {}
