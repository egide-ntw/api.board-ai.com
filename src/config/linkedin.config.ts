import { registerAs } from '@nestjs/config';
import { LinkedInConfig } from './config.type';

export default registerAs<LinkedInConfig>('linkedin', () => ({
  clientId: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL: process.env.LINKEDIN_CALLBACK_URL,
}));
