/**
 * @author: Egide Ntwali
 * @description: The data transfer object for the apple login
 * @property idToken: string
 * @property firstName: string
 * @property lastName: string
 * @returns: AuthAppleLoginDto
 */

import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsNotEmpty } from 'class-validator';

export class AuthAppleLoginDto {
  @ApiProperty({ example: 'abc' })
  @IsNotEmpty()
  idToken: string;

  @Allow()
  @ApiProperty({ required: false })
  firstName?: string;

  @Allow()
  @ApiProperty({ required: false })
  lastName?: string;
}
