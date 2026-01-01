import { Test, TestingModule } from '@nestjs/testing';
import { AuthLinkedInController } from './auth-linkedin.controller';
import { AuthLinkedInService } from './auth-linkedin.service';

describe('AuthLinkedinController', () => {
  let controller: AuthLinkedInController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthLinkedInController],
      providers: [AuthLinkedInService],
    }).compile();

    controller = module.get<AuthLinkedInController>(AuthLinkedInService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
