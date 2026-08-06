import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UploadedFile, UseInterceptors, BadGatewayException, HttpCode } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) { }
  
  @Post()
  @UseInterceptors(
    FileInterceptor('audio'),
  )
  @ApiConsumes('multipart/form-data')
  
  @ApiBody({
    schema: {
      type: 'object',
      properties: {

        deviceId: {
          type: 'string',
        },

        createdBy: {
          type: 'string',
        },

        startTime: {
          type: 'string',
          format: 'date-time',
        },

        endTime: {
          type: 'string',
          format: 'date-time',
        },

        audio: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  create(
    @Body()
    createMeetingDto: CreateMeetingDto,

    @UploadedFile()
    file: any,
  ) {

    return this.meetingsService.create(
      createMeetingDto,
      file,
    );
  }

  @Post('process-meeting')
@HttpCode(202)
@UseInterceptors(FileInterceptor('audio'))
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      deviceId: {
        type: 'string',
      },
      createdBy: {
        type: 'string',
      },
      startTime: {
        type: 'string',
        format: 'date-time',
      },
      endTime: {
        type: 'string',
        format: 'date-time',
      },
      audio: {
        type: 'string',
        format: 'binary',
      },
    },
  },
})
async processMeeting(
  @UploadedFile() file: any,
  @Body('deviceId') deviceId: string,
  @Body('createdBy') createdBy: string,
  @Body('startTime') startTime: Date,
  @Body('endTime') endTime: Date,
) {
  return this.meetingsService.processMeeting(
    {
      deviceId,
      createdBy,
      startTime,
      endTime,
    },
    file,
  );
}

  @Get()
  findAll() {
    return this.meetingsService.findAll();
  }

  // Queue overview: waiting / active / completed / failed counts
  @Get('queue/stats')
  queueStats() {
    return this.meetingsService.getQueueStats();
  }

  // Lightweight status for polling a single meeting
  @Get(':id/status')
  getStatus(@Param('id') id: string) {
    return this.meetingsService.getStatus(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.meetingsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMeetingDto: UpdateMeetingDto) {
    return this.meetingsService.update(id, updateMeetingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.meetingsService.remove(id);
  }
}
