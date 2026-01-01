import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { SessionAnalytics } from './entities/session-analytics.entity';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionAnalytics]),
    ConversationsModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
