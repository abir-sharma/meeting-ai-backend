import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DeviceDocument = Device & Document;

@Schema({ timestamps: true })
export class Device {

  @Prop({
    required: true,
    unique: true,
  })
  deviceId: string;

  @Prop({
    required: true,
  })
  name: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: false,
  })
  pairedUserId: Types.ObjectId;

  @Prop({
    enum: ['ONLINE', 'OFFLINE', 'PAIRED'],
    default: 'OFFLINE',
  })
  status: string;

  @Prop({
    type: Date,
    default: Date.now,
  })
  lastActive: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);