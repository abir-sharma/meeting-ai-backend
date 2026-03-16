// user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type UserDocument = User & Document

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string

  @Prop({
  required: false,
  select: false,
})
password?: string

  @Prop({ required: true, trim: true })
  name: string

  @Prop({ trim: true })
  organization: string

  // ✅ Added mobile field
  @Prop({
    type: String,
    required: false,
    unique: true,
    trim: true,
    index: true,
    sparse: true,
  })
  mobile?: string;

  @Prop({ type: String, select: false, default: null })
  resetPasswordOtp: string | null

  @Prop({ type: Date, select: false, default: null })
  resetPasswordOtpExpires: Date | null
}

export const UserSchema = SchemaFactory.createForClass(User)