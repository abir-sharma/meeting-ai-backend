import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MeetingSpeakerSegmentDocument = MeetingSpeakerSegment & Document;

@Schema({ timestamps: true })
export class MeetingSpeakerSegment {

  @Prop({
    type: Types.ObjectId,
    ref: 'Meeting',
    required: true,
    index: true,
  })
  meetingId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: false,
  })
  speakerId: Types.ObjectId;

  // Display name: a registered speaker's name, or "Speaker A/B" for
  // unidentified speakers detected by diarization.
  @Prop({
    type: String,
  })
  speakerName: string;

  @Prop({
    type: Number,
  })
  confidence: number;

  @Prop({
    required: true,
  })
  startTime: number;

  @Prop({
    required: true,
  })
  endTime: number;

  @Prop({
    required: true,
  })
  text: string;
}

export const MeetingSpeakerSegmentSchema =
  SchemaFactory.createForClass(MeetingSpeakerSegment);