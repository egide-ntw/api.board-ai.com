import { Test, TestingModule } from '@nestjs/testing';
import { RedisCachingService } from './redis-caching.service';
import { ConfigService } from '@nestjs/config';

describe('RedisCachingService', () => {
  let service: RedisCachingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisCachingService,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(undefined) } },
      ],
    }).compile();

    service = module.get<RedisCachingService>(RedisCachingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
