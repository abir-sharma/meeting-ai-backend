import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VoiceProfileDocument = VoiceProfile & Document;

export enum VoiceProfileStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class VoiceProfile {

  @Prop({ required: true })
  name!: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: false,
  })
  userId!: Types.ObjectId;

  // Filled in asynchronously by the background worker once the Python
  // service returns the embedding, so it is not required at creation.
  @Prop({ type: [Number], default: [] })
  voiceEmbedding!: number[];

  @Prop({ type: String })
  audioUrl!: string;

  // S3 object key for the uploaded enrollment audio (used by the worker).
  @Prop({ type: String })
  audioKey!: string;

  @Prop({
    type: String,
    enum: VoiceProfileStatus,
    default: VoiceProfileStatus.PROCESSING,
  })
  status!: VoiceProfileStatus;

  @Prop({ type: String })
  error!: string;

}

export const VoiceProfileSchema = SchemaFactory.createForClass(VoiceProfile);
