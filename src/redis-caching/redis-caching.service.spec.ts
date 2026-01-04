import { Test, TestingModule } from '@nestjs/testing';
import { RedisCachingService } from './redis-caching.service';

describe('RedisCachingService', () => {
  let service: RedisCachingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisCachingService],
    }).compile();

    service = module.get<RedisCachingService>(RedisCachingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
