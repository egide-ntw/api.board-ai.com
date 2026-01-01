// auth-linkedin.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';
import { AllConfigType } from 'src/config/config.type';
import { SocialInterface } from '../social/interfaces/social.interface';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class LinkedinStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor(
    private configService: ConfigService<AllConfigType>,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.getOrThrow('linkedIn.clientId', { infer: true }),
      clientSecret: configService.getOrThrow('linkedIn.clientSecret', {
        infer: true,
      }),
      callbackURL: configService.getOrThrow('linkedIn.callBackUrl', {
        infer: true,
      }),
      scope: ['r_emailaddress', 'r_liteprofile'],
      state: true,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    // Changed return type to any
    const { id, name, emails } = profile;

    const socialData: SocialInterface = {
      id: id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
    };

    // validateSocialLogin will return { token: string, user: User }
    return this.authService.validateSocialLogin('linkedin', socialData);
  }
}
