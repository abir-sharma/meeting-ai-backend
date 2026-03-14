import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MeetingSpeakerSegmentsService } from './meeting-speaker-segment.service';
import { CreateMeetingSpeakerSegmentDto } from './dto/create-meeting-speaker-segment.dto';
import { UpdateMeetingSpeakerSegmentDto } from './dto/update-meeting-speaker-segment.dto';

@Controller('meeting-speaker-segment')
export class MeetingSpeakerSegmentController {
  constructor(private readonly meetingSpeakerSegmentService: MeetingSpeakerSegmentsService) {}

  @Post()
  create(@Body() createMeetingSpeakerSegmentDto: CreateMeetingSpeakerSegmentDto) {
    return this.meetingSpeakerSegmentService.create(createMeetingSpeakerSegmentDto);
  }

  @Get()
  findAll() {
    return this.meetingSpeakerSegmentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.meetingSpeakerSegmentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMeetingSpeakerSegmentDto: UpdateMeetingSpeakerSegmentDto) {
    return this.meetingSpeakerSegmentService.update(id, updateMeetingSpeakerSegmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.meetingSpeakerSegmentService.remove(id);
  }
}
