import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { SignupDto } from './dto/signup.dto';
import { LoginEmailDto } from './dto/login.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify.dto';

@Controller('auth')
export class AuthController {

  constructor(private authService: AuthService) { }

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login-email')
  login(@Body() dto: LoginEmailDto) {
    return this.authService.loginEmail(dto);
  }

  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.mobile);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post("change-password")
  async changePassword(
    @Req() req,
    @Body() body: { currentPassword: string; newPassword: string }
  ) {
    const userId = req.user.id

    return this.authService.changePassword(
      userId,
      body.currentPassword,
      body.newPassword
    )
  }

  @Post("forgot-password")
  async forgotPassword(@Body() body: { email: string }) {

    return this.authService.forgotPassword(body.email)

  }

  @Post("reset-password")
  async resetPassword(
    @Body()
    body: {
      email: string
      otp: string
      newPassword: string
    }
  ) {

    return this.authService.resetPassword(
      body.email,
      body.otp,
      body.newPassword
    )

  }
}
