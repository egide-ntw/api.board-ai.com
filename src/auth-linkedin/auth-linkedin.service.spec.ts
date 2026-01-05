import { Test, TestingModule } from '@nestjs/testing';
import { AuthLinkedInService } from './auth-linkedin.service';
import { ConfigService } from '@nestjs/config';

describe('AuthLinkedinService', () => {
  let service: AuthLinkedInService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthLinkedInService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthLinkedInService>(AuthLinkedInService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
