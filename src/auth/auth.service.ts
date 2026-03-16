import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { AxiosError } from 'axios';
import { SendOtpDto } from './dto/send-otp.dto';
import { PwAuthService } from './pw-auth.service';
import { LoginEmailDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify.dto';


@Injectable()
export class AuthService {

  constructor(
    private usersService: UsersService,
    private pwAuthService: PwAuthService,
    private jwtService: JwtService
  ) { }


  async signup(dto: SignupDto) {

    const existing = await this.usersService.findByEmail(dto.email)

    if (existing) {
      throw new ConflictException("Email already exists")
    }

    const userData: any = {
      email: dto.email,
      name: dto.name
    }

    if (dto.mobile) {

      const existingMobile = await this.usersService.findByMobile(dto.mobile)

      if (existingMobile) {
        throw new ConflictException("Mobile already registered")
      }

      try {

        // try registering in PW
        await this.pwAuthService.registerMobile(
          dto.mobile,
          dto.name,
          dto.name
        )

      } catch (error: any) {

        const message =
          error?.response?.data?.error?.message ||
          error?.message

        // ✅ If user already exists in PW, ignore error
        if (!message?.toLowerCase().includes("exist")) {
          throw error
        }

        // else continue (sync DB with PW)
      }

      userData.mobile = dto.mobile
    }

    userData.password = await bcrypt.hash(dto.password, 10)

    const user = await this.usersService.create(userData)

    return {
      message: "User created successfully",
      userId: user._id
    }
  }

  async loginEmail(dto: LoginEmailDto) {

    const user = await this.usersService.findByEmail(dto.email)

    if (!user || !user.password) {
      throw new UnauthorizedException("Invalid credentials")
    }

    const match = await bcrypt.compare(dto.password, user.password)

    if (!match) {
      throw new UnauthorizedException("Invalid credentials")
    }

    const payload = {
      sub: user._id,
      email: user.email
    }

    const token = await this.jwtService.signAsync(payload)

    return {
      access_token: token
    }
  }

  async sendOtp(mobile: string) {
    // 1️⃣ Check user in DB
    const user = await this.usersService.findByMobile(mobile);

    if (!user) {
      throw new NotFoundException("User does not exist");
    }
    const response = await this.pwAuthService.sendOtp(mobile)
    return {
      message: "OTP sent successfully",
      data: response
    }
  }

  async verifyOtp(dto: VerifyOtpDto) {

    const otpRes = await this.pwAuthService.verifyOtp(dto.mobile, dto.otp)

    let user = await this.usersService.findByMobile(dto.mobile)

    // user not in our DB but exists in PW
    if (!user) {

      user = await this.usersService.create({
        name: "Mobile User",
        mobile: dto.mobile,
        email: `${dto.mobile}@mobile.local`
      })
    }

    const payload = {
      sub: user._id,
      mobile: user.mobile
    }

    const token = await this.jwtService.signAsync(payload)

    return {
      access_token: token,
      pwToken: otpRes.access_token
    }
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  // async login(dto: LoginDto) {
  //   // findByEmail must select password explicitly, e.g. .select('+password')
  //   const user = await this.usersService.findByEmailWithPassword(dto.email)

  //   if (!user) {
  //     throw new UnauthorizedException('Invalid credentials')
  //   }

  //   const match = await bcrypt.compare(dto.password, user.password)
  //   if (!match) {
  //     throw new UnauthorizedException('Invalid credentials')
  //   }

  //   const token = await this.jwtService.signAsync({
  //     sub: user._id,
  //     email: user.email,
  //   })

  //   return { access_token: token }
  // }

  // ─── PenPencil Helpers ────────────────────────────────────────────────────

  /** Register a new user on PenPencil by mobile */
  // private async registerWithPenPencil(
  //   phone: string,
  //   name: string,
  // ): Promise<void> {
  //   const [firstName, ...rest] = name.trim().split(' ')
  //   const lastName = rest.join(' ') || ''

  //   try {
  //     await axios.post(
  //       `https://api.penpencil.co/v1/users/register/${PENPENCIL_REG_ID}`,
  //       {
  //         mobile: phone,
  //         countryCode: '+91',
  //         firstName,
  //         lastName,
  //       },
  //     )
  //   } catch (err) {
  //     this.handlePenPencilError(err, 'PenPencil registration failed')
  //   }
  // }

  // /** Send OTP to mobile via PenPencil */
  // // async sendOtp(phone: string): Promise<{ message: string }> {
  // //   try {
  // //     await axios.post(
  // //       'https://api.penpencil.co/v1/users/get-otp?smsType=0',
  // //       {
  // //         username: phone,
  // //         countryCode: '+91',
  // //         organizationId: PENPENCIL_ORG_ID,
  // //       },
  // //     )
  // //     return { message: 'OTP sent successfully' }
  // //   } catch (err) {
  // //     this.handlePenPencilError(err, 'Failed to send OTP')
  // //   }
  // // }

  // /** Verify OTP and return PenPencil access token */
  // async verifyOtp(
  //   phone: string,
  //   otp: string,
  // ): Promise<{ access_token: string }> {
  //   try {
  //     const res = await axios.post(
  //       'https://api.penpencil.co/v3/oauth/token',
  //       {
  //         username: phone,
  //         otp,
  //         client_id: 'system-admin',
  //         client_secret: 'KjPXuAVfC5xbmgreETNMaL7z',
  //         grant_type: 'password',
  //         organizationId: PENPENCIL_ORG_ID,
  //         latitude: 0,
  //         longitude: 0,
  //       },
  //     )
  //     return { access_token: res.data?.data?.access_token }
  //   } catch (err) {
  //     this.handlePenPencilError(err, 'OTP verification failed')
  //   }
  // }

  // /** Centralised PenPencil error mapper */
  // private handlePenPencilError(err: unknown, fallback: string): never {
  //   if (err instanceof AxiosError) {
  //     const status = err.response?.status
  //     const message =
  //       err.response?.data?.message ?? err.response?.data?.error ?? fallback

  //     if (status === 409) throw new ConflictException(message)
  //     if (status === 400) throw new ConflictException(message)   // bad mobile etc.
  //     if (status === 401) throw new UnauthorizedException(message)
  //   }
  //   throw new InternalServerErrorException(fallback)
  // }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {

    const user = await this.usersService.findOne(userId);
    if (!user || !user.password) {
      throw new UnauthorizedException("Invalid credentials")
    }

    if (!user) {
      throw new Error("User not found")
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)

    if (!isMatch) {
      throw new Error("Current password is incorrect")
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    user.password = hashedPassword
    await user.save()

    return { message: "Password updated successfully" }
  }

  async forgotPassword(email: string) {

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new Error("User not found")
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString()

    const hashedOtp = await bcrypt.hash(otp, 10)

    user.resetPasswordOtp = hashedOtp
    user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000)

    await user.save()


    return { message: "OTP sent to email" }
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ) {

    const user = await this.usersService.findByEmail(email)

    if (!user) {
      throw new Error("User not found")
    }

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
      throw new Error("OTP not found")
    }

    if (user.resetPasswordOtpExpires < new Date()) {
      throw new Error("OTP expired")
    }

    const isValid = await bcrypt.compare(otp, user.resetPasswordOtp)

    if (!isValid) {
      throw new Error("Invalid OTP")
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    user.password = hashedPassword
    user.resetPasswordOtp = null
    user.resetPasswordOtpExpires = null

    await user.save()

    return { message: "Password reset successful" }
  }

}
