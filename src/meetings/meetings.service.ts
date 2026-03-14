import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';

import { Meeting, MeetingDocument } from './entities/meeting.entity';

@Injectable()
export class MeetingsService {

  constructor(
    @InjectModel(Meeting.name)
    private readonly meetingModel: Model<MeetingDocument>,
  ) {}

  async create(createMeetingDto: CreateMeetingDto) {
    try {

      const meeting = new this.meetingModel(createMeetingDto);

      return await meeting.save();

    } catch (error: any) {

      if (error.code === 11000) {
        throw new ConflictException('Meeting already exists');
      }

      throw error;
    }
  }

  async findAll() {

    return this.meetingModel
      .find()
      .populate('deviceId', 'deviceId name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

  }

  async findOne(id: string) {

    const meeting = await this.meetingModel
      .findById(id)
      .populate('deviceId', 'deviceId name')
      .populate('createdBy', 'name email');

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return meeting;
  }

  async update(id: string, updateMeetingDto: UpdateMeetingDto) {

    try {

      const meeting = await this.meetingModel
        .findByIdAndUpdate(id, updateMeetingDto, {
          new: true,
          runValidators: true,
        });

      if (!meeting) {
        throw new NotFoundException('Meeting not found');
      }

      return meeting;

    } catch (error: any) {

      if (error.code === 11000) {
        throw new ConflictException('Duplicate meeting data');
      }

      throw error;
    }
  }

  async remove(id: string) {

    const meeting = await this.meetingModel.findByIdAndDelete(id);

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return {
      message: 'Meeting deleted successfully',
    };
  }

}