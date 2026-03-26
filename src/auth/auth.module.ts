import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard, PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PwAuthService } from './pw-auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { AuthIdentity, AuthIdentitySchema } from 'src/auth/entities/auth_identities.entity';
import { EmailOtp, EmailOtpSchema } from './entities/email-otp.schema';
import { MailService } from './mail-smtp.service';
import { Meeting, MeetingSchema } from 'src/meetings/entities/meeting.entity';
import { Device, DeviceSchema } from 'src/devices/entities/device.entity';
import { VoiceProfile, VoiceProfileSchema } from 'src/voice-profiles/entities/voice-profile.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },                 // ✅ ADD THIS
      { name: AuthIdentity.name, schema: AuthIdentitySchema }, // ✅ already
      { name: EmailOtp.name, schema: EmailOtpSchema },
      { name: Meeting.name, schema: MeetingSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: VoiceProfile.name, schema: VoiceProfileSchema },

    ]),
    UsersModule,
    PassportModule,
    ConfigModule,

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET')!, // ⭐
        signOptions: { expiresIn: '1d' },
      }),
    })
  ],
  providers: [AuthService, JwtStrategy, PwAuthService, MailService],
  controllers: [AuthController],
})
export class AuthModule { }