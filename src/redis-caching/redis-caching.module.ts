import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisCachingService } from './redis-caching.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisCachingService],
  exports: [RedisCachingService],
})
export class RedisCachingModule {}
