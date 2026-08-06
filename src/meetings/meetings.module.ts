import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Meeting, MeetingSchema } from './entities/meeting.entity';
import { MeetingGateway } from './meeting.gateway';
import { MeetingsProcessor } from './meetings.processor';
import { MeetingSpeakerSegment, MeetingSpeakerSegmentSchema } from 'src/meeting-speaker-segment/entities/meeting-speaker-segment.entity';
import { S3Service } from 'src/common/s3/s3.service';
import { VoiceProfile, VoiceProfileSchema } from 'src/voice-profiles/entities/voice-profile.entity';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { QUEUE_MEETINGS } from 'src/queue/queue.constants';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Meeting.name, schema: MeetingSchema },
      {
        name: MeetingSpeakerSegment.name,
        schema: MeetingSpeakerSegmentSchema,
      },
      {
        name: VoiceProfile.name, schema: VoiceProfileSchema
      }
    ]),
    BullModule.registerQueue({
      name: QUEUE_MEETINGS,
    }),
    BullBoardModule.forFeature({
      name: QUEUE_MEETINGS,
      adapter: BullMQAdapter,
    }),
    WebsocketModule,
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService, MeetingGateway, MeetingsProcessor, S3Service],
  exports: [MeetingsService]
})
export class MeetingsModule { }
