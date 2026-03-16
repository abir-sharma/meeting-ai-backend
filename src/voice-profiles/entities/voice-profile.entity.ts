import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VoiceProfileDocument = VoiceProfile & Document;

@Schema({ timestamps: true })
export class VoiceProfile {

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ type: [Number], required: true })
  voiceEmbedding: number[];

}

export const VoiceProfileSchema = SchemaFactory.createForClass(VoiceProfile);