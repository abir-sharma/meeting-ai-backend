import { Test, TestingModule } from '@nestjs/testing';
import { MeetingSpeakerSegmentService } from './meeting-speaker-segment.service';

describe('MeetingSpeakerSegmentService', () => {
  let service: MeetingSpeakerSegmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MeetingSpeakerSegmentService],
    }).compile();

    service = module.get<MeetingSpeakerSegmentService>(MeetingSpeakerSegmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
