import { Module } from '@nestjs/common';
import { AuthLinkedInService } from './auth-linkedin.service';
import { AuthLinkedInController } from './auth-linkedin.controller';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from 'src/auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    PassportModule.register({ defaultStrategy: 'linkedin' }),
  ],
  controllers: [AuthLinkedInController],
  providers: [AuthLinkedInService],
})
export class AuthLinkedinModule {}
