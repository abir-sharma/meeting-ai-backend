import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true, // automatically adds createdAt & updatedAt
})
export class User {

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({
    required: true,
    select: false, // password not returned by default
  })
  password: string;

  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    trim: true,
  })
  organization: string;

}

export const UserSchema = SchemaFactory.createForClass(User);