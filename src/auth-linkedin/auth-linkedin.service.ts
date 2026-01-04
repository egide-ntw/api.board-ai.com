// auth-linkedin.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';
import { SocialInterface } from '../social/interfaces/social.interface';

@Injectable()
export class AuthLinkedInService {
  constructor(private configService: ConfigService<AllConfigType>) {}

  getProfileByToken(profile: any): Promise<SocialInterface> {
    const socialData: SocialInterface = {
      id: profile.id,
      email: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
    };

    return Promise.resolve(socialData);
  }
}
