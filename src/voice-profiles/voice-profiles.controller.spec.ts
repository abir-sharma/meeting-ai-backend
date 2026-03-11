import { Test, TestingModule } from '@nestjs/testing';
import { VoiceProfilesController } from './voice-profiles.controller';
import { VoiceProfilesService } from './voice-profiles.service';

describe('VoiceProfilesController', () => {
  let controller: VoiceProfilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VoiceProfilesController],
      providers: [VoiceProfilesService],
    }).compile();

    controller = module.get<VoiceProfilesController>(VoiceProfilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
