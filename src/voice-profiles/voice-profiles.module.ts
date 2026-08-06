import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { VoiceProfilesService } from './voice-profiles.service';
import { VoiceProfilesController } from './voice-profiles.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { VoiceProfile, VoiceProfileSchema } from './entities/voice-profile.entity';
import { S3Module } from 'src/common/s3/s3.module';
import { VoiceProfilesProcessor } from './voice-profiles.processor';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { QUEUE_VOICE_PROFILES } from 'src/queue/queue.constants';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VoiceProfile.name, schema: VoiceProfileSchema }
    ]),
    S3Module,
    BullModule.registerQueue({
      name: QUEUE_VOICE_PROFILES,
    }),
    BullBoardModule.forFeature({
      name: QUEUE_VOICE_PROFILES,
      adapter: BullMQAdapter,
    }),
    WebsocketModule,
  ],
  controllers: [VoiceProfilesController],
  providers: [VoiceProfilesService, VoiceProfilesProcessor],
})
export class VoiceProfilesModule {}
