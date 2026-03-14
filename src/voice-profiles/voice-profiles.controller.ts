import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { VoiceProfilesService } from './voice-profiles.service';
import { CreateVoiceProfileDto } from './dto/create-voice-profile.dto';
import { UpdateVoiceProfileDto } from './dto/update-voice-profile.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('voice-profiles')
export class VoiceProfilesController {
  constructor(private readonly voiceProfilesService: VoiceProfilesService) { }

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
    return this.voiceProfilesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVoiceProfileDto: UpdateVoiceProfileDto) {
    return this.voiceProfilesService.update(+id, updateVoiceProfileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.voiceProfilesService.remove(+id);
  }
}
