import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VoiceProfilesModule } from './voice-profiles/voice-profiles.module';
import { MeetingsModule } from './meetings/meetings.module';
import { DevicesModule } from './devices/devices.module';
import { AuthModule } from './auth/auth.module';
import { DevicesModule } from './devices/devices.module';
import { MeetingsModule } from './meetings/meetings.module';
import { VoiceProfilesModule } from './voice-profiles/voice-profiles.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [AuthModule, UsersModule, DevicesModule, MeetingsModule, VoiceProfilesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
