import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import mongoose from "mongoose"

export type AuthIdentityDocument = AuthIdentity & Document


@Schema({ timestamps: true })
export class AuthIdentity {

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    })
    userId: mongoose.Types.ObjectId

    @Prop({
        required: true,
        enum: ['email', 'mobile']
    })
    type: 'email' | 'mobile'

    @Prop({
        required: true,
        unique: false,
        index: false
    })
    value: string   // email OR mobile

    @Prop({ select: false })
    password?: string

    @Prop({ type: String, select: false, default: null })
    resetPasswordOtp?: string | null;

    @Prop({ type: Date, select: false, default: null })
    resetPasswordOtpExpires?: Date | null;
}

export const AuthIdentitySchema = SchemaFactory.createForClass(AuthIdentity)