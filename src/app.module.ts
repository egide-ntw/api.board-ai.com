import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import databaseConfig from './config/database.config';
import authConfig from './config/auth.config';
import appConfig from './config/app.config';
import mailConfig from './config/mail.config';
import fileConfig from './config/file.config';
import googleConfig from './config/google.config';
import * as path from 'path';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGoogleModule } from './auth-google/auth-google.module';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { MailConfigService } from './mail/mail-config.service';
import { ForgotModule } from './forgot/forgot.module';
import { MailModule } from './mail/mail.module';
import { HomeModule } from './home/home.module';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AllConfigType } from './config/config.type';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisCachingModule } from './redis-caching/redis-caching.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { PersonasModule } from './personas/personas.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiModule } from './ai/ai.module';
import { BoardModule } from './board/board.module';
import { OrchestrationModule } from './orchestration/orchestration.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        authConfig,
        appConfig,
        mailConfig,
        fileConfig,
        googleConfig,
      ],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions) => {
        const dataSource = await new DataSource(options).initialize();
        return dataSource;
      },
    }),
    MailerModule.forRootAsync({
      useClass: MailConfigService,
    }),
    UsersModule,
    // FilesModule,
    AuthModule,
    AuthGoogleModule,
    ForgotModule,
    MailModule,
    HomeModule,
    ScheduleModule.forRoot(),
    RedisCachingModule,
    ConversationsModule,
    MessagesModule,
    AttachmentsModule,
    PersonasModule,
    AnalyticsModule,
    AiModule,
    BoardModule,
    OrchestrationModule,
  ],
})
export class AppModule {}
