import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, trusted, Types } from 'mongoose';

export type MeetingDocument = Meeting & Document;

export enum MeetingStatus {
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class Meeting {

  @Prop({
    type: Types.ObjectId,
    ref: 'Device',
    required: true,
  })
  deviceId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy!: Types.ObjectId;

  @Prop({
    required: true,
  })
  audioUrl!: string;

  // S3 object key for the uploaded meeting audio (used by the worker to
  // re-fetch the file when processing the queued job).
  @Prop({
    type: String,
  })
  audioKey!: string;

  // Populated when status === FAILED so the failure reason is queryable.
  @Prop({
    type: String,
  })
  error!: string;

  @Prop({
    type: String,
  })
  transcript!: string;

  @Prop({
    type: String,
  })
  summary!: string;

  @Prop({
    enum: MeetingStatus,
    default: MeetingStatus.RECORDING,
  })
  status!: MeetingStatus;

  @Prop({
    type: Date,
    required: true,
  })
  startTime!: Date;

  @Prop({
    type: Date,
  })
  endTime!: Date;
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);
