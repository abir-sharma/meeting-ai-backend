import { Test, TestingModule } from '@nestjs/testing';
import { VoiceProfilesService } from './voice-profiles.service';

describe('VoiceProfilesService', () => {
  let service: VoiceProfilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VoiceProfilesService],
    }).compile();

    service = module.get<VoiceProfilesService>(VoiceProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
