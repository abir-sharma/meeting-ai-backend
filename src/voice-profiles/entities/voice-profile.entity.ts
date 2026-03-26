import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VoiceProfileDocument = VoiceProfile & Document;

@Schema({ timestamps: true })
export class VoiceProfile {

  @Prop({ required: true })
  name: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: false,
  })
  userId: Types.ObjectId;

  @Prop({ type: [Number], required: true })
  voiceEmbedding: number[];

}

export const VoiceProfileSchema = SchemaFactory.createForClass(VoiceProfile);