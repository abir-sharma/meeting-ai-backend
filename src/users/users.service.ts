import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UsersService {

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) { }

  async findByEmail(email: string) {
    return this.userModel
      .findOne({ email })
      .select('+password')
      .select("+resetPasswordOtp +resetPasswordOtpExpires");
  }

  async findByMobile(mobile: string) {
    return this.userModel.findOne({ mobile }).select("+password");
  }

  // users.service.ts  — only the two relevant methods shown
  // async findByEmail(email: string) {
  //   return this.userModel.findOne({ email }).exec()
  // }


  // ✅ New — explicitly re-selects the hidden password field
  async findByEmailWithPassword(email: string) {
    return this.userModel.findOne({ email }).select('+password').exec()
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const user = new this.userModel(createUserDto);
      return await user.save();

    } catch (error: any) {

      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }

      throw error;
    }
  }

  async findAll() {
    return this.userModel
      .find()
      .select('-password');
  }

  async findOne(id: string) {
    const user = await this.userModel
      .findById(id)
      .select('-password');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {

    try {

      const user = await this.userModel
        .findByIdAndUpdate(id, updateUserDto, {
          new: true,
        })
        .select('-password');

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;

    } catch (error: any) {

      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }

      throw error;
    }
  }

  async remove(id: string) {

    const user = await this.userModel.findByIdAndDelete(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { message: 'User deleted successfully' };
  }
}