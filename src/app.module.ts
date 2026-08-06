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
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { MeetingSpeakerSegmentModule } from './meeting-speaker-segment/meeting-speaker-segment.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Shared BullMQ / Redis connection used by all queues.
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    // Bull Board dashboard mounted at /admin/queues
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    AuthModule,
    UsersModule,
    DevicesModule,
    MeetingsModule,
    VoiceProfilesModule,
    WebsocketModule,
    MongooseModule.forRoot(process.env.MONGO_URI!), MeetingSpeakerSegmentModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
