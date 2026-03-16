import { Module } from '@nestjs/common';
import { VoiceProfilesService } from './voice-profiles.service';
import { VoiceProfilesController } from './voice-profiles.controller';
import { UserSchema } from 'src/users/entities/user.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { VoiceProfile, VoiceProfileSchema } from './entities/voice-profile.entity';

@Module({
  imports: [
      MongooseModule.forFeature([
        { name: VoiceProfile.name, schema: VoiceProfileSchema }
      ])
    ],
  controllers: [VoiceProfilesController],
  providers: [VoiceProfilesService],
})
export class VoiceProfilesModule {}
