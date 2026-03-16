import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { VoiceProfilesService } from './voice-profiles.service';
import { CreateVoiceProfileDto } from './dto/create-voice-profile.dto';
import { UpdateVoiceProfileDto } from './dto/update-voice-profile.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RegisterVoiceDto } from './dto/register-voice-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('voice-profiles')
export class VoiceProfilesController {
  constructor(private readonly voiceProfilesService: VoiceProfilesService) { }

   @Post('register')
  @UseInterceptors(FileInterceptor('audio'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Abir Sharma' },
        userId: { type: 'string', example: '64f8a3d2c9e77f4a2a1b1234' },
        audio: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async registerVoice(
    @Body() dto: RegisterVoiceDto,
    @UploadedFile() file: Express.Multer.File,
  ) {

    if (!file) {
      throw new Error("Audio file is required");
    }

    /**
     * Here you would normally send audio to AI service
     * to generate voice embedding
     */

    const fakeEmbedding = [0.12, 0.45, 0.77, 0.32];

    return this.voiceProfilesService.create({
      ...dto,
      voiceEmbedding: fakeEmbedding,
    });
  }

  @Post()
  create(@Body() createVoiceProfileDto: CreateVoiceProfileDto) {
    return this.voiceProfilesService.create(createVoiceProfileDto);
  }

  @Get()
  findAll() {
    return this.voiceProfilesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.voiceProfilesService.findOne(id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateVoiceProfileDto: UpdateVoiceProfileDto) {
  //   return this.voiceProfilesService.update(+id, updateVoiceProfileDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.voiceProfilesService.remove(id);
  }
}
