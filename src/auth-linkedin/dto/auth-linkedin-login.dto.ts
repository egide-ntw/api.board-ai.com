import { ApiProperty } from '@nestjs/swagger';

export class AuthLinkedInLoginDto {
  @ApiProperty({
    description: 'LinkedIn OAuth 2.0 access token',
    example: 'AQWgT7iJPeD9QeB...',
  })
  accessToken: string;
}
