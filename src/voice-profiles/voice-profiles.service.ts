import { Injectable } from '@nestjs/common';
import { CreateVoiceProfileDto } from './dto/create-voice-profile.dto';
import { UpdateVoiceProfileDto } from './dto/update-voice-profile.dto';

@Injectable()
export class VoiceProfilesService {
  create(createVoiceProfileDto: CreateVoiceProfileDto) {
    return 'This action adds a new voiceProfile';
  }

  findAll() {
    return `This action returns all voiceProfiles`;
  }

  findOne(id: number) {
    return `This action returns a #${id} voiceProfile`;
  }

  update(id: number, updateVoiceProfileDto: UpdateVoiceProfileDto) {
    return `This action updates a #${id} voiceProfile`;
  }

  remove(id: number) {
    return `This action removes a #${id} voiceProfile`;
  }
}
