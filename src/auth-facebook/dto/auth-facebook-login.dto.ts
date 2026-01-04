/**
 * @author: Egide Ntwali
 * @description: The data transfer object for the facebook login
 * @property accessToken: string
 * @returns: AuthFacebookLoginDto
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AuthFacebookLoginDto {
  @ApiProperty({ example: 'abc' })
  @IsNotEmpty()
  accessToken: string;
}
