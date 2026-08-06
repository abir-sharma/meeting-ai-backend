import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { MeetingsService } from './meetings.service';
import { QUEUE_MEETINGS, JOB_PROCESS_MEETING } from 'src/queue/queue.constants';

@Processor(QUEUE_MEETINGS)
export class MeetingsProcessor extends WorkerHost {

  private readonly logger = new Logger(MeetingsProcessor.name);

  constructor(
    private readonly meetingsService: MeetingsService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {

    switch (job.name) {

      case JOB_PROCESS_MEETING: {
        const { meetingId } = job.data;
        this.logger.log(`Processing meeting ${meetingId} (job ${job.id})`);
        return this.meetingsService.handleProcessMeetingJob(meetingId);
      }

      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        return null;
    }
  }
}
