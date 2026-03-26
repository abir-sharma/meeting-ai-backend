import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailOtpDocument = EmailOtp & Document;

@Schema({ timestamps: true })
export class EmailOtp {

  @Prop({ required: true, index: true })
  email: string;

  @Prop({ required: true })
  otp: string;

  @Prop({ required: true })
  password: string; // temp store hashed password

  @Prop({ required: true })
  expiresAt: Date;
}

export const EmailOtpSchema = SchemaFactory.createForClass(EmailOtp);