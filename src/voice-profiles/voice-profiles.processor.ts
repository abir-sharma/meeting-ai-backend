import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { VoiceProfilesService } from './voice-profiles.service';
import {
  QUEUE_VOICE_PROFILES,
  JOB_REGISTER_VOICE,
} from 'src/queue/queue.constants';

@Processor(QUEUE_VOICE_PROFILES)
export class VoiceProfilesProcessor extends WorkerHost {

  private readonly logger = new Logger(VoiceProfilesProcessor.name);

  constructor(
    private readonly voiceProfilesService: VoiceProfilesService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {

    switch (job.name) {

      case JOB_REGISTER_VOICE: {
        const { profileId } = job.data;
        this.logger.log(`Registering voice ${profileId} (job ${job.id})`);
        return this.voiceProfilesService.handleRegisterVoiceJob(profileId);
      }

      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        return null;
    }
  }
}
