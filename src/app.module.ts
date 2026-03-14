import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DevicesModule } from './devices/devices.module';
import { MeetingsModule } from './meetings/meetings.module';
import { VoiceProfilesModule } from './voice-profiles/voice-profiles.module';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { MeetingSpeakerSegmentModule } from './meeting-speaker-segment/meeting-speaker-segment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule, 
    UsersModule, 
    DevicesModule, 
    MeetingsModule, 
    VoiceProfilesModule,    
    MongooseModule.forRoot(process.env.MONGO_URI!), MeetingSpeakerSegmentModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
