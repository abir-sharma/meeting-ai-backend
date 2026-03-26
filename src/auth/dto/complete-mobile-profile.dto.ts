// dto/complete-profile.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CompleteProfileDto {
    @ApiProperty({ example: "Abir sharma" })

    @IsString()
    name: string;

    @ApiProperty({ example: "PW pvt. ltd." })
    @IsString()
    organization: string;

    @IsOptional()
    @IsString()
    email: string;

    @IsOptional()
    @IsString()
    mobile: string;
}