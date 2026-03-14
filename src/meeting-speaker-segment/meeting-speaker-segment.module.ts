import { Module } from '@nestjs/common';
import { MeetingSpeakerSegmentsService } from './meeting-speaker-segment.service';
import { MeetingSpeakerSegmentController } from './meeting-speaker-segment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MeetingSpeakerSegment, MeetingSpeakerSegmentSchema } from './entities/meeting-speaker-segment.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MeetingSpeakerSegment.name, schema: MeetingSpeakerSegmentSchema }
    ]),
  ],
  controllers: [MeetingSpeakerSegmentController],
  providers: [MeetingSpeakerSegmentsService],
  exports: [MeetingSpeakerSegmentsService]
})
@Module({

})
export class MeetingSpeakerSegmentModule { }
