import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { MeetingSpeakerSegment, MeetingSpeakerSegmentDocument }
  from './entities/meeting-speaker-segment.entity';

import { CreateMeetingSpeakerSegmentDto }
  from './dto/create-meeting-speaker-segment.dto';

import { UpdateMeetingSpeakerSegmentDto }
  from './dto/update-meeting-speaker-segment.dto';

@Injectable()
export class MeetingSpeakerSegmentsService {

  constructor(
    @InjectModel(MeetingSpeakerSegment.name)
    private readonly segmentModel: Model<MeetingSpeakerSegmentDocument>,
  ) {}

  async create(createDto: CreateMeetingSpeakerSegmentDto) {

    try {

      const segment = new this.segmentModel(createDto);

      return await segment.save();

    } catch (error: any) {

      if (error.code === 11000) {
        throw new ConflictException('Duplicate speaker segment');
      }

      throw error;
    }
  }

  async findAll() {

    return this.segmentModel
      .find()
      .populate('meetingId')
      .populate('speakerId', 'name email')
      .sort({ startTime: 1 });

  }

  async findByMeeting(meetingId: string) {

    return this.segmentModel
      .find({ meetingId })
      .populate('speakerId', 'name email')
      .sort({ startTime: 1 });

  }

  async findOne(id: string) {

    const segment = await this.segmentModel
      .findById(id)
      .populate('speakerId', 'name email');

    if (!segment) {
      throw new NotFoundException('Speaker segment not found');
    }

    return segment;
  }

  async update(id: string, updateDto: UpdateMeetingSpeakerSegmentDto) {

    try {

      const segment = await this.segmentModel
        .findByIdAndUpdate(id, updateDto, {
          new: true,
          runValidators: true,
        });

      if (!segment) {
        throw new NotFoundException('Speaker segment not found');
      }

      return segment;

    } catch (error: any) {

      if (error.code === 11000) {
        throw new ConflictException('Duplicate speaker segment');
      }

      throw error;
    }
  }

  async remove(id: string) {

    const segment = await this.segmentModel.findByIdAndDelete(id);

    if (!segment) {
      throw new NotFoundException('Speaker segment not found');
    }

    return {
      message: 'Speaker segment deleted successfully',
    };
  }
}