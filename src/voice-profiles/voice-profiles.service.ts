import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { VoiceProfile, VoiceProfileDocument } from './entities/voice-profile.entity';
import { CreateVoiceProfileDto } from './dto/create-voice-profile.dto';

@Injectable()
export class VoiceProfilesService {

  constructor(
    @InjectModel(VoiceProfile.name)
    private readonly voiceProfileModel: Model<VoiceProfileDocument>,
  ) {}

  async create(createVoiceProfileDto: CreateVoiceProfileDto) {

    try {

      const profile = new this.voiceProfileModel(createVoiceProfileDto);

      return await profile.save();

    } catch (error: any) {

      if (error.code === 11000) {
        throw new ConflictException("Voice profile already exists");
      }

      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll() {
    return this.voiceProfileModel.find().sort({ createdAt: -1 });
  }

  async findOne(id: string) {

    const profile = await this.voiceProfileModel.findById(id);

    if (!profile) {
      throw new NotFoundException("Voice profile not found");
    }

    return profile;
  }

  async remove(id: string) {

    const profile = await this.voiceProfileModel.findByIdAndDelete(id);

    if (!profile) {
      throw new NotFoundException("Voice profile not found");
    }

    return {
      message: "Voice profile deleted successfully",
    };
  }

}