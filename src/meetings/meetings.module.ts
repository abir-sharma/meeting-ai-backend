import { Module } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Meeting, MeetingSchema } from './entities/meeting.entity';
import { MeetingGateway } from './meeting.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Meeting.name, schema: MeetingSchema }
    ])
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService,MeetingGateway],
  exports: [MeetingsService]
})
export class MeetingsModule {}
