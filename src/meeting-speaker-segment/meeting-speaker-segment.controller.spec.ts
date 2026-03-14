import { Test, TestingModule } from '@nestjs/testing';
import { MeetingSpeakerSegmentController } from './meeting-speaker-segment.controller';
import { MeetingSpeakerSegmentService } from './meeting-speaker-segment.service';

describe('MeetingSpeakerSegmentController', () => {
  let controller: MeetingSpeakerSegmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeetingSpeakerSegmentController],
      providers: [MeetingSpeakerSegmentService],
    }).compile();

    controller = module.get<MeetingSpeakerSegmentController>(MeetingSpeakerSegmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
