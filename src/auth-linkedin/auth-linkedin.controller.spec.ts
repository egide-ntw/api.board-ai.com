import { Test, TestingModule } from '@nestjs/testing';
import { AuthLinkedInController } from './auth-linkedin.controller';
import { AuthLinkedInService } from './auth-linkedin.service';
import { AuthService } from '../auth/auth.service';

describe('AuthLinkedinController', () => {
  let controller: AuthLinkedInController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthLinkedInController],
      providers: [
        { provide: AuthLinkedInService, useValue: { getProfileByToken: jest.fn() } },
        { provide: AuthService, useValue: { validateSocialLogin: jest.fn() } },
      ],
    }).compile();

    controller = module.get<AuthLinkedInController>(AuthLinkedInController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
