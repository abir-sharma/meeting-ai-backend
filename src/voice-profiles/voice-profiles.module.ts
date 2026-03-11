import { Module } from '@nestjs/common';
import { VoiceProfilesService } from './voice-profiles.service';
import { VoiceProfilesController } from './voice-profiles.controller';

@Module({
  controllers: [VoiceProfilesController],
  providers: [VoiceProfilesService],
})
export class VoiceProfilesModule {}
