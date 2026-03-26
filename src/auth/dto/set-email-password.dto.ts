import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SetPasswordDto {
  @ApiProperty({
    example: 'reset-token-from-email',
    description: 'Token received in email link',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'StrongPassword@123',
    description: 'New password',
  })
  @IsString()
  @MinLength(6)
  password: string;
}