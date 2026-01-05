import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { AuthLinkedInService } from './auth-linkedin.service';
import { AuthLinkedInLoginDto } from './dto/auth-linkedin-login.dto';
import { LoginResponseType } from '../utils/types/auth/login-response.type';

@ApiTags('Auth')
@Controller({
  path: 'auth/linkedin',
  version: '1',
})
export class AuthLinkedInController {
  constructor(
    private readonly authService: AuthService,
    private readonly authLinkedInService: AuthLinkedInService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: AuthLinkedInLoginDto,
  ): Promise<LoginResponseType> {
    const socialData = await this.authLinkedInService.getProfileByToken(
      loginDto,
    );

    return this.authService.validateSocialLogin('linkedin', socialData);
  }
}
