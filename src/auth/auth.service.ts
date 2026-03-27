import { BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PwAuthService } from './pw-auth.service';
import { MobileSignupDto, SignupDto } from './dto/signup-mobile.dto';
import { User } from 'src/users/entities/user.entity';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { AuthIdentity } from 'src/auth/entities/auth_identities.entity';
import { LoginDto, MobileLoginDto } from './dto/login-mobile.dto';
import { EmailSignupDto } from './dto/signup-email.dto';
import { EmailLoginDto } from './dto/login-email.dto';
import { CompleteProfileDto } from './dto/complete-mobile-profile.dto';
import { generateRandomPassword, splitName } from 'src/common/utils';
import { MailService } from './mail-smtp.service';
import { EmailOtp } from './entities/email-otp.schema';
import { Meeting } from 'src/meetings/entities/meeting.entity';
import { Device } from 'src/devices/entities/device.entity';
import { VoiceProfile } from 'src/voice-profiles/entities/voice-profile.entity';
import * as crypto from "crypto"
import { SetPasswordDto } from './dto/set-email-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LinkProfileDto } from './dto/link-mobile.dto';

@Injectable()
export class AuthService {

  constructor(
    private mailService: MailService,
    private jwtService: JwtService,
    private pwService: PwAuthService,
    @InjectConnection() private readonly connection: Connection,

    @InjectModel('EmailOtp') private readonly emailOtpModel: Model<EmailOtp>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('AuthIdentity') private readonly authIdentityModel: Model<AuthIdentity>,
    @InjectModel('Meeting') private readonly meetingModel: Model<Meeting>,
    @InjectModel('Device') private readonly deviceModel: Model<Device>,
    @InjectModel('VoiceProfile') private readonly voiceProfileModel: Model<VoiceProfile>,

  ) { }

  async signup(dto: SignupDto) {
    if (dto.type === 'email') {
      if (!dto.email || !dto.password) {
        throw new BadRequestException('Email and password are required');
      }

      return this.signupWithEmail({
        email: dto.email,
        password: dto.password,
      });
    }

    if (dto.type === 'mobile') {
      if (!dto.mobile || !dto.name) {
        throw new BadRequestException('Name and Mobile are required');
      }


      return this.signupWithMobile({
        name: dto.name,
        mobile: dto.mobile,
      });
    }

    throw new BadRequestException('Invalid signup type');
  }

  async login(dto: LoginDto) {
    if (dto.type === 'email') {
      if (!dto.email || !dto.password) {
        throw new BadRequestException('Email and password are required');
      }

      return this.loginWithEmail({
        email: dto.email,
        password: dto.password,
      });
    }

    if (dto.type === 'mobile') {
      if (!dto.mobile) {
        throw new BadRequestException('Mobile is required');
      }


      return this.loginWithMobile({
        mobile: dto.mobile,
      });
    }

    throw new BadRequestException('Invalid signup type');
  }

  async verifyOtp(dto: VerifyOtpDto) {
    if (dto.type === 'email') {
      if (!dto.email || !dto.otp) {
        throw new BadRequestException('Email and otp are required');
      }

      return this.verifyEmailOtp(dto.email, dto.otp);
    }

    if (dto.type === 'mobile' || !dto.otp) {
      if (!dto.mobile || !dto.otp) {
        throw new BadRequestException('Mobile and otp are required');
      }


      return this.verifyMobileOtp(dto.mobile, dto.otp);
    }

    throw new BadRequestException('Invalid signup type');
  }

  async linkProfile(userId: string, dto: LinkProfileDto) {
    if (dto.type === 'email') {
      if (!dto.email || !dto.otp) {
        throw new BadRequestException('Email and otp are required');
      }

      return this.verifyAndLinkEmail(userId, dto.email, dto.otp);
    }

    if (dto.type === 'mobile' || !dto.otp) {
      if (!dto.mobile || !dto.otp) {
        throw new BadRequestException('Mobile and otp are required');
      }


      return this.verifyAndLinkMobile(userId, dto.mobile, dto.otp);
    }

    throw new BadRequestException('Invalid signup type');
  }

  async signupWithMobile(dto: MobileSignupDto) {
    const { mobile, name } = dto;

    const { firstName, lastName } = splitName(name);

    try {
      // 1️⃣ Check in DB
      const existingIdentity = await this.authIdentityModel.findOne({
        type: 'mobile',
        value: mobile,
      });

      if (existingIdentity) {
        throw new ConflictException('User already exists, please login');
      }

      try {
        // 2️⃣ Try registering in OTP system
        await this.pwService.registerMobile(
          mobile,
          firstName,
          lastName
        );

        // ✅ CASE 3: New user → OTP sent → DO NOT create user yet
        return {
          message: 'OTP sent for signup',
        };

      } catch (err: any) {

        // ✅ CASE 2: User already exists in OTP system
        if (err?.message?.includes('User Already Exist')) {

          // 👉 Create user immediately in DB
          const user = await this.userModel.create({
            name,
            isProfileComplete: false,
          });

          await this.authIdentityModel.create({
            userId: user._id.toString(),
            type: 'mobile',
            value: mobile,
          });

          return {
            message: 'User already exists, please login',
          };
        }

        throw err; // unknown error
      }

    } catch (error) {

      // 🔥 Handle duplicate race condition
      if (error.code === 11000) {
        throw new ConflictException('Mobile already exists');
      }

      if (error instanceof ConflictException) {
        throw error;
      }

      console.error('SIGNUP MOBILE ERROR 👉', error);

      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async loginWithMobile(dto: MobileLoginDto) {
    const { mobile } = dto;

    const identity = await this.authIdentityModel.findOne({
      type: 'mobile',
      value: mobile,
    });

    if (!identity) {
      throw new BadRequestException('User not found, please signup first');
    }

    const user = await this.userModel.findById(identity.userId);

    // ✅ Send OTP (use existing name if needed)
    await this.pwService.sendOtp(mobile);

    return { message: 'OTP sent for login' };
  }

  // async verifyOtp(mobile: string, otp: string) {
  //   try {
  //     // 1️⃣ Verify OTP via provider
  //     await this.pwService.verifyOtp(mobile, otp);

  //     // 2️⃣ Check identity
  //     let identity = await this.authIdentityModel.findOne({
  //       type: 'mobile',
  //       value: mobile,
  //     });

  //     let user;

  //     // LOGIN
  //     if (identity) {
  //       user = await this.userModel.findById(identity.userId);

  //       if (!user) {
  //         throw new InternalServerErrorException('User data corrupted');
  //       }
  //     }

  //     // SIGNUP
  //     else {
  //       user = await this.userModel.create({
  //         isProfileComplete: false,
  //       });

  //       identity = await this.authIdentityModel.create({
  //         userId: user._id.toString(),
  //         type: 'mobile',
  //         value: mobile,
  //       });
  //     }

  //     // JWT
  //     const payload = {
  //       sub: user._id.toString(),
  //       mobile,
  //     };

  //     const accessToken = await this.jwtService.signAsync(payload);

  //     return {
  //       user: {
  //         id: user._id,
  //         name: user.name,
  //         isProfileComplete: user.isProfileComplete,
  //       },
  //       accessToken,
  //     };

  //   } catch (error) {

  //     // ✅ 🔥 MOST IMPORTANT LINE
  //     if (error instanceof HttpException) {
  //       throw error; // 👈 preserve original error (400, 401, etc.)
  //     }

  //     // Mongo duplicate
  //     if (error.code === 11000) {
  //       throw new ConflictException('Mobile already exists');
  //     }

  //     console.error('VERIFY OTP ERROR 👉', error);

  //     throw new InternalServerErrorException('Something went wrong');
  //   }
  // }
  async verifyMobileOtp(mobile: string, otp: string) {
    try {
      const normalizedMobile = mobile.trim();

      // 1️⃣ Verify OTP
      await this.pwService.verifyOtp(normalizedMobile, otp);

      // 2️⃣ Find identity
      let identity = await this.authIdentityModel.findOne({
        type: 'mobile',
        value: normalizedMobile,
      });

      let user;

      if (identity) {
        user = await this.userModel.findById(identity.userId);

        if (!user) {
          throw new InternalServerErrorException('User data corrupted');
        }
      } else {
        user = await this.userModel.create({
          isProfileComplete: false,
        });

        identity = await this.authIdentityModel.create({
          userId: user._id,
          type: 'mobile',
          value: normalizedMobile,
        });
      }

      // 3️⃣ Generate JWT
      const payload = {
        sub: user._id.toString(),
        mobile: normalizedMobile,
      };

      const accessToken = await this.jwtService.signAsync(payload);

      // 4️⃣ Reuse response builder
      const userResponse = await this.buildUserResponse(user._id);

      return {
        user: userResponse,
        accessToken,
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error.code === 11000) {
        throw new ConflictException('Mobile already exists');
      }

      console.error('VERIFY OTP ERROR 👉', error);

      throw new InternalServerErrorException('Something went wrong');
    }
  }


  async signupWithEmail(dto: EmailSignupDto) {
    try {
      const { email, password } = dto;

      // 1️⃣ Check if already exists
      const existing = await this.authIdentityModel.findOne({
        type: 'email',
        value: email,
      });

      if (existing) {
        throw new ConflictException('Email already exists, please login');
      }

      // 2️⃣ Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // 3️⃣ Hash password (store temporarily)
      const hashedPassword = await bcrypt.hash(password, 10);

      // 4️⃣ Store OTP + temp data (IMPORTANT)
      await this.emailOtpModel.findOneAndUpdate(
        { email }, // find existing OTP for this email
        {
          otp,
          password: hashedPassword,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
        {
          upsert: true, // create if not exists
          new: true,
        }
      );

      // 5️⃣ Send Email via SMTP
      await this.mailService.sendOtpEmail(email, otp);

      return {
        message: 'OTP sent to email',
      };

    } catch (error) {

      // ✅ Preserve known errors
      if (error instanceof HttpException) {
        throw error;
      }

      // ✅ Mongo duplicate safety
      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }

      console.error('EMAIL SIGNUP ERROR 👉', error);

      throw new InternalServerErrorException('Something went wrong');
    }
  }

  // async loginWithEmail(dto: EmailLoginDto) {
  //   try {
  //     const { email, password } = dto;

  //     // 1️⃣ Find identity
  //     const identity = await this.authIdentityModel
  //       .findOne({
  //         type: 'email',
  //         value: email,
  //       })
  //       .select('+password');

  //     if (!identity) {
  //       throw new BadRequestException('User not found');
  //     }

  //     if (!identity.password) {
  //       throw new BadRequestException('Password not set for this user');
  //     }

  //     // 2️⃣ Compare password
  //     const isMatch = await bcrypt.compare(password, identity.password);

  //     if (!isMatch) {
  //       throw new UnauthorizedException('Invalid credentials');
  //     }

  //     // 3️⃣ Get user
  //     const user = await this.userModel.findById(identity.userId);

  //     if (!user) {
  //       throw new InternalServerErrorException('User data corrupted');
  //     }

  //     // 4️⃣ Generate JWT
  //     const payload = {
  //       sub: user._id.toString(),
  //       email,
  //     };

  //     const accessToken = await this.jwtService.signAsync(payload);
  //     return {
  //       user: {
  //         id: user._id,
  //         isProfileComplete: user.isProfileComplete,
  //       },
  //       accessToken,
  //     };

  //   } catch (error) {

  //     if (error instanceof HttpException) {
  //       throw error;
  //     }

  //     console.error('LOGIN EMAIL ERROR 👉', error);

  //     throw new InternalServerErrorException('Something went wrong');

  //   }
  // }


  // async verifyEmailOtp(email: string, otp: string) {
  //   try {
  //     // 1️⃣ Find OTP record
  //     const record = await this.emailOtpModel.findOne({ email });

  //     if (!record) {
  //       throw new BadRequestException('OTP not found');
  //     }

  //     // 2️⃣ Check expiry
  //     if (record.expiresAt < new Date()) {
  //       throw new BadRequestException('OTP expired');
  //     }

  //     // 3️⃣ Validate OTP
  //     if (record.otp !== otp) {
  //       throw new BadRequestException('Invalid OTP');
  //     }

  //     // 4️⃣ Check if user already exists (LOGIN vs SIGNUP)
  //     let identity = await this.authIdentityModel.findOne({
  //       type: 'email',
  //       value: email,
  //     });

  //     let user;

  //     // ✅ LOGIN
  //     if (identity) {
  //       user = await this.userModel.findById(identity.userId);

  //       if (!user) {
  //         throw new InternalServerErrorException('User data corrupted');
  //       }
  //     }

  //     // ✅ SIGNUP
  //     else {
  //       user = await this.userModel.create({
  //         isProfileComplete: false,
  //       });

  //       identity = await this.authIdentityModel.create({
  //         userId: user._id,
  //         type: 'email',
  //         value: email,
  //         password: record.password,
  //       });
  //     }

  //     // 5️⃣ Delete OTP
  //     await this.emailOtpModel.deleteOne({ email });

  //     // 6️⃣ Generate JWT
  //     const payload = {
  //       sub: user._id.toString(),
  //       email,
  //     };

  //     const accessToken = await this.jwtService.signAsync(payload);

  //     return {
  //       user: {
  //         id: user._id,
  //         isProfileComplete: user.isProfileComplete,
  //       },
  //       accessToken,
  //     };

  //   } catch (error) {

  //     if (error instanceof HttpException) {
  //       throw error;
  //     }

  //     if (error.code === 11000) {
  //       throw new ConflictException('Email already exists');
  //     }

  //     console.error('VERIFY EMAIL OTP ERROR 👉', error);

  //     throw new InternalServerErrorException('Something went wrong');
  //   }
  // }
  async loginWithEmail(dto: EmailLoginDto) {
    try {
      const { email, password } = dto;
      const normalizedEmail = email.trim().toLowerCase();

      // 1️⃣ Find identity
      const identity = await this.authIdentityModel
        .findOne({
          type: 'email',
          value: normalizedEmail,
        })
        .select('+password');

      if (!identity) {
        throw new BadRequestException('User not found');
      }

      if (!identity.password) {
        throw new BadRequestException('Password not set for this user');
      }

      // 2️⃣ Compare password
      const isMatch = await bcrypt.compare(password, identity.password);

      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // 3️⃣ Get user
      const user = await this.userModel.findById(identity.userId);

      if (!user) {
        throw new InternalServerErrorException('User data corrupted');
      }

      // 4️⃣ Get ALL identities (email + mobile)
      const identities = await this.authIdentityModel.find({
        userId: user._id,
      });

      const emailValue =
        identities.find((i) => i.type === 'email')?.value || null;

      const mobileValue =
        identities.find((i) => i.type === 'mobile')?.value || null;

      // 5️⃣ Generate JWT
      const payload = {
        sub: user._id.toString(),
        email: emailValue,
      };

      const accessToken = await this.jwtService.signAsync(payload);

      // 6️⃣ Build response
      const userResponse: any = {
        id: user._id,
        isProfileComplete: user.isProfileComplete,
        email: emailValue,
        mobile: mobileValue,
      };

      // ✅ Add profile details only if complete
      if (user.isProfileComplete) {
        userResponse.name = user.name;
        userResponse.organization = user.organization;
      }

      return {
        user: userResponse,
        accessToken,
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('LOGIN EMAIL ERROR 👉', error);

      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async verifyEmailOtp(email: string, otp: string) {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // 1️⃣ Find OTP record
      const record = await this.emailOtpModel.findOne({ email: normalizedEmail });

      if (!record) {
        throw new BadRequestException('OTP not found');
      }

      // 2️⃣ Check expiry
      if (record.expiresAt < new Date()) {
        throw new BadRequestException('OTP expired');
      }

      // 3️⃣ Validate OTP
      if (record.otp !== otp) {
        throw new BadRequestException('Invalid OTP');
      }

      // 4️⃣ Find identity
      let identity = await this.authIdentityModel.findOne({
        type: 'email',
        value: normalizedEmail,
      });

      let user;

      // ✅ LOGIN
      if (identity) {
        user = await this.userModel.findById(identity.userId);

        if (!user) {
          throw new InternalServerErrorException('User data corrupted');
        }
      }

      // ✅ SIGNUP
      else {
        user = await this.userModel.create({
          isProfileComplete: false,
        });

        identity = await this.authIdentityModel.create({
          userId: user._id,
          type: 'email',
          value: normalizedEmail,
          password: record.password,
        });
      }

      // 5️⃣ Delete OTP
      await this.emailOtpModel.deleteOne({ email: normalizedEmail });

      // 6️⃣ Get ALL identities (email + mobile)
      const identities = await this.authIdentityModel.find({
        userId: user._id,
      });

      let emailValue: string | null = null;
      let mobileValue: string | null = null;

      identities.forEach((item) => {
        if (item.type === 'email') emailValue = item.value;
        if (item.type === 'mobile') mobileValue = item.value;
      });

      // 7️⃣ Generate JWT
      const payload = {
        sub: user._id.toString(),
        email: emailValue,
      };

      const accessToken = await this.jwtService.signAsync(payload);

      // 8️⃣ Build response conditionally
      const userResponse: any = {
        id: user._id,
        isProfileComplete: user.isProfileComplete,
        email: emailValue,
        mobile: mobileValue,
      };

      // ✅ Only include profile details if complete
      if (user.isProfileComplete) {
        userResponse.name = user.name;
        userResponse.organization = user.organization;
      }

      return {
        user: userResponse,
        accessToken,
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }

      console.error('VERIFY EMAIL OTP ERROR 👉', error);

      throw new InternalServerErrorException('Something went wrong');
    }
  }


  async completeProfile(mobile: string, email: string, userId: string, dto: CompleteProfileDto) {
    const { name, organization } = dto;

    const primaryUser = await this.userModel.findById(userId);
    if (!primaryUser) throw new NotFoundException('Primary user not found');

    // Update name/organization regardless of mobile/email flow
    await this.userModel.findByIdAndUpdate(userId, { name, organization });
    console.log(name, organization, mobile, email, userId, "name")
    // ─── MOBILE FLOW ──────────────────────────────────────────────
    if (mobile != undefined) {
      const { firstName, lastName } = splitName(dto.name);

      try {
        // 1️⃣ Try sending OTP directly
        await this.pwService.sendOtp(mobile);
      } catch (error) {
        const message =
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          error.message;
        console.log("OTP ERROR MESSAGE:", message);
        // 2️⃣ If user not found → register first
        if (message?.toLowerCase().includes('not exist')) {
          await this.pwService.registerMobile(mobile, firstName, lastName);
        } else {
          // 4️⃣ Other errors → throw
          throw error;
        }
      }

      return { message: 'OTP sent successfully to your mobile.' };
    }

    // ─── EMAIL FLOW ───────────────────────────────────────────────
    if (email != undefined) {
      // 2️⃣ Generate OTP 
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      // 4️⃣ Store OTP + temp data (IMPORTANT)
      await this.emailOtpModel.findOneAndUpdate(
        { email }, // find existing OTP for this email
        {
          otp,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
        {
          upsert: true, // create if not exists
          new: true,
        }
      );

      // 5️⃣ Send Email via SMTP
      // console.log(first)
      try {
        await this.mailService.sendOtpEmail(email, otp);

      } catch (error) {
        const message =
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          error.message;
        console.log("OTP ERROR MESSAGE:", message);
      }      // console.log(otp,"EmailOtp")

      return { message: 'OTP sent successfully. Check your email.' };
    }
  }

  // ─── CALL THIS AFTER USER SUBMITS OTP ───────────────────────────────────────

  async verifyAndLinkMobile(userId: string, mobile: string, otp: string) {
    // 1. Verify OTP
    console.log(userId, mobile, otp, "data2")
    try {
      await this.pwService.verifyOtp(mobile, otp);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // ✅ send proper response
      }

      console.error('VERIFY EMAIL OTP ERROR 👉', error);

      throw new InternalServerErrorException('OTP verification failed');
    }
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const primaryUser = await this.userModel.findById(userId).session(session);
      if (!primaryUser) throw new NotFoundException('Primary user not found');
      console.log(primaryUser, "pu")

      const secondaryUser = await this.authIdentityModel.findOne({ type: "mobile", value: mobile }).session(session);
      console.log(secondaryUser, "su")

      if (!secondaryUser) {
        // Mobile not tied to any account — just link it
        await this.authIdentityModel.create([{ userId, type: 'mobile', value: mobile }], { session });
        primaryUser.isProfileComplete = true;
        await primaryUser.save({ session });

        await session.commitTransaction();

        return { message: 'Mobile linked successfully' };

      } else {
        if (secondaryUser.userId.toString() === userId) {
          await session.commitTransaction();
          return { message: 'Already linked' };
        }
        // Mobile belongs to another account — merge into secondary, delete primary
        await this.remapUserReferences(secondaryUser.userId, primaryUser._id, session);
        await this.userModel.deleteOne({ _id: secondaryUser.userId }, { session });
        const result = await this.authIdentityModel.updateMany(
          { userId: secondaryUser.userId },   // ✅ match by userId
          { $set: { userId: userId } },
          { session }      // ✅ update to new userId
        );
        primaryUser.isProfileComplete = true;
        await primaryUser.save({ session });

        await session.commitTransaction();
        console.log(result, "result");
        return { message: 'Accounts merged successfully' };

      }
    } catch (error) {
      await session.abortTransaction();

      console.error('MERGE ERROR 👉', error);

      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException('Merge failed');
    } finally {
      session.endSession();
    }

  }

  private async buildUserResponse(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const identities = await this.authIdentityModel.find({ userId });

    const email = identities.find(i => i.type === 'email')?.value || null;
    const mobile = identities.find(i => i.type === 'mobile')?.value || null;

    const response: any = {
      id: user._id,
      isProfileComplete: user.isProfileComplete,
      email,
      mobile,
    };

    if (user.isProfileComplete) {
      response.name = user.name;
      response.organization = user.organization;
    }

    return response;
  }


  async verifyAndLinkEmail(userId: string, email: string, otp: string) {
    // 1. Verify OTP
    try {
      await this.verifyEmailOtpForMerge(email, otp);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // ✅ send proper response
      }

      console.error('VERIFY EMAIL OTP ERROR 👉', error);

      throw new InternalServerErrorException('OTP verification failed');
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const primaryUser = await this.userModel.findById(userId).session(session);
      if (!primaryUser) throw new NotFoundException('Primary user not found');
      console.log(primaryUser, "pu")
      console.log(email, "email")
      // const secondaryUser = await this.userModel.findOne({ email });
      const secondaryUser = await this.authIdentityModel.findOne({ type: "email", value: email }).session(session);
      console.log(secondaryUser, "su")
      if (!secondaryUser) {
        console.log("abir sharma")
        // Link email
        const plainPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        await this.authIdentityModel.create(
          [{ userId, type: 'email', value: email, password: hashedPassword }],
          { session }
        );

        try {
          await this.mailService.sendEmailWithPassword(email, plainPassword);

        } catch (error) {
          if (error instanceof HttpException) {
            throw error; // ✅ send proper response
          }

          console.error('Set password link send fail 👉', error);

          throw new InternalServerErrorException('Set password link not sent.');
        }

        primaryUser.isProfileComplete = true;
        await primaryUser.save({ session });

        await session.commitTransaction();

        return { message: 'Email linked successfully. Please check your email for password.' };

      } else {

        if (secondaryUser.userId.toString() === userId) {
          await session.commitTransaction();
          return { message: 'Already linked' };
        }
        await this.remapUserReferences(secondaryUser.userId, primaryUser._id, session);
        await this.userModel.deleteOne({ _id: secondaryUser.userId }, { session });

        const result = await this.authIdentityModel.updateMany(
          { userId: secondaryUser.userId },   // ✅ match by userId
          { $set: { userId: userId } },
          { session }      // ✅ update to new userId
        );

        console.log(result, "result");
        primaryUser.isProfileComplete = true;
        await primaryUser.save({ session });

        await session.commitTransaction();

        return { message: 'Accounts merged successfully' };

      }

    } catch (error) {
      await session.abortTransaction();

      console.error('MERGE ERROR 👉', error);

      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException('Merge failed');
    } finally {
      session.endSession();
    }

  }

  async verifyEmailOtpForMerge(email: string, otp: string) {
    const normalizedEmail = email.trim().toLowerCase();

    // 1️⃣ Find OTP record
    const record = await this.emailOtpModel.findOne({
      email: normalizedEmail,
    });

    if (!record) {
      throw new BadRequestException('OTP not found');
    }

    // 2️⃣ Check expiry
    if (record.expiresAt < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    // 3️⃣ Validate OTP
    if (record.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // 4️⃣ Delete OTP (one-time use)
    await this.emailOtpModel.deleteOne({ email: normalizedEmail });

    // 5️⃣ Return success
    return {
      success: true,
      message: 'OTP verified successfully',
    };
  }

  // ─── REMAP HELPER ────────────────────────────────────────────────────────────

  private async remapUserReferences(
    fromId: Types.ObjectId,
    toId: Types.ObjectId,
    session: ClientSession
  ) {
    await Promise.all([
      this.authIdentityModel.updateMany(
        { userId: fromId },
        { $set: { userId: toId } },
        { session }
      ),

      this.meetingModel.updateMany(
        { createdBy: fromId },
        { $set: { createdBy: toId } },
        { session }
      ),

      this.deviceModel.updateMany(
        { pairedUserId: fromId },
        { $set: { pairedUserId: toId } },
        { session }
      ),

      this.voiceProfileModel.updateMany(
        { userId: fromId },
        { $set: { userId: toId } },
        { session }
      ),
    ]);
  }


  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    // 1️⃣ Get user with password
    const identity = await this.authIdentityModel
      .findOne({ userId, type: "email" })
      .select("+password");
    if (!identity) {
      throw new NotFoundException("User not found");
    }

    if (!identity.password) {
      throw new BadRequestException("Password not set for this account");
    }

    // 2️⃣ Verify current password
    const isMatch = await bcrypt.compare(currentPassword, identity.password);

    if (!isMatch) {
      throw new BadRequestException("Current password is incorrect");
    }

    // 3️⃣ Prevent same password reuse
    const isSame = await bcrypt.compare(newPassword, identity.password);

    if (isSame) {
      throw new BadRequestException(
        "New password cannot be same as current password"
      );
    }

    // 4️⃣ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 5️⃣ Update password
    identity.password = hashedPassword;
    await identity.save();

    return {
      message: "Password changed successfully",
    };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    console.log(email, "email")
    // 1️⃣ Find user
    const identity = await this.authIdentityModel.findOne({ value: normalizedEmail });

    if (!identity) {
      throw new NotFoundException("User with this email does not exist");
    }

    // 2️⃣ Generate OTP (6-digit)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3️⃣ Set expiry (10 minutes)
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    // 4️⃣ Save OTP in DB
    identity.resetPasswordOtp = otp;
    identity.resetPasswordOtpExpires = expires;

    await identity.save();

    // 5️⃣ Send OTP (you already have mailService)
    await this.mailService.sendOtpEmail(normalizedEmail, otp);

    return {
      message: "OTP sent to email",
    };
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ) {
    const normalizedEmail = email.trim().toLowerCase();

    // 1️⃣ Find user with OTP fields
    const identity = await this.authIdentityModel
      .findOne({ value: normalizedEmail })
      .select("+password +resetPasswordOtp +resetPasswordOtpExpires");

    if (!identity) {
      throw new NotFoundException("User not found");
    }

    // 2️⃣ Check OTP exists
    if (!identity.resetPasswordOtp || !identity.resetPasswordOtpExpires) {
      throw new BadRequestException("OTP not requested");
    }

    // 3️⃣ Check expiry
    if (identity.resetPasswordOtpExpires < new Date()) {
      throw new BadRequestException("OTP expired");
    }

    // 4️⃣ Validate OTP
    if (identity.resetPasswordOtp !== otp) {
      throw new BadRequestException("Invalid OTP");
    }
    if (!identity.password) {
      throw new BadRequestException("Password not set for this account");
    }
    // 5️⃣ Prevent same password reuse
    const isSame = await bcrypt.compare(newPassword, identity.password);
    if (isSame) {
      throw new BadRequestException(
        "New password cannot be same as old password"
      );
    }

    // 6️⃣ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 7️⃣ Update password + clear OTP
    identity.password = hashedPassword;
    identity.resetPasswordOtp = null;
    identity.resetPasswordOtpExpires = null;

    await identity.save();

    return {
      message: "Password reset successfully",
    };
  }

}
