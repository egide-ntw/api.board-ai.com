import { Test, TestingModule } from '@nestjs/testing';
import { AuthLinkedInService } from './auth-linkedin.service';

describe('AuthLinkedinService', () => {
  let service: AuthLinkedInService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthLinkedInService],
    }).compile();

    service = module.get<AuthLinkedInService>(AuthLinkedInService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
