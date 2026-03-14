import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

import { Device, DeviceDocument } from './entities/device.entity';

@Injectable()
export class DevicesService {

  constructor(
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
  ) {}

  async create(createDeviceDto: CreateDeviceDto) {
    try {

      const device = new this.deviceModel(createDeviceDto);

      return await device.save();

    } catch (error: any) {

      if (error.code === 11000) {
        throw new ConflictException('Device with this deviceId already exists');
      }

      throw error;
    }
  }

  async findAll() {

    return this.deviceModel
      .find()
      .populate('pairedUserId', 'name email')
      .sort({ createdAt: -1 });

  }

  async findOne(id: string) {

    const device = await this.deviceModel
      .findById(id)
      .populate('pairedUserId', 'name email');

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return device;
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto) {

    try {

      const device = await this.deviceModel
        .findByIdAndUpdate(id, updateDeviceDto, {
          new: true,
          runValidators: true,
        });

      if (!device) {
        throw new NotFoundException('Device not found');
      }

      return device;

    } catch (error: any) {

      if (error.code === 11000) {
        throw new ConflictException('Device with this deviceId already exists');
      }

      throw error;
    }
  }

  async remove(id: string) {

    const device = await this.deviceModel.findByIdAndDelete(id);

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return { message: 'Device deleted successfully' };
  }
}