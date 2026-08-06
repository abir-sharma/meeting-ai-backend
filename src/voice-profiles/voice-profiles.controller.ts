import { Controller, Get, Post, Body, Param, Delete, UploadedFile, UseInterceptors, BadRequestException, HttpCode } from '@nestjs/common';
import { VoiceProfilesService } from './voice-profiles.service';
import { CreateVoiceProfileDto } from './dto/create-voice-profile.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { RegisterVoiceDto } from './dto/register-voice-profile.dto';

// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
@Controller('voice-profiles')
export class VoiceProfilesController {
  constructor(private readonly voiceProfilesService: VoiceProfilesService) { }

  @Post('register')
  @HttpCode(202)
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

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        userId: {
          type: 'string',
        },
        audio: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async registerVoice(
    @Body() dto: RegisterVoiceDto,
    @UploadedFile() file: any,
  ) {

    if (!file) {
      throw new BadRequestException('Audio file is required');
    }
    return this.voiceProfilesService.registerVoice(dto, file);
  }
  
  
  @Get()
  findAll() {
    return this.voiceProfilesService.findAll();
  }
  
  
  // Queue overview: waiting / active / completed / failed counts
  @Get('queue/stats')
  queueStats() {
    return this.voiceProfilesService.getQueueStats();
  }
  
  // Lightweight status for polling a single voice profile
  @Get(':id/status')
  getStatus(@Param('id') id: string) {
    return this.voiceProfilesService.getStatus(id);
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
