import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CompleteProfileDto } from './dto/complete-mobile-profile.dto';
import { MobileSignupDto } from './dto/signup-mobile.dto';
import { MobileLoginDto } from './dto/login-mobile.dto';
import { EmailSignupDto } from './dto/signup-email.dto';
import { EmailLoginDto } from './dto/login-email.dto';
import { LinkMobileDto } from './dto/link-mobile.dto';
import { VerifyOtpDto } from './dto/verify.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Controller('auth')
export class AuthController {

  constructor(private authService: AuthService) { }

  // 🔹 Mobile Signup
  @Post('signup/mobile')
  @ApiOperation({
    summary: 'Signup using mobile number',
    description: 'This Api can be used to signup using mobile number',
  })
  signupMobile(@Body() dto: MobileSignupDto) {
    return this.authService.signupWithMobile(dto);
  }


  // 🔹 Mobile Login
  @Post('login/mobile')
  @ApiOperation({
    summary: 'Login via mobile number',
  })
  loginMobile(@Body() dto: MobileLoginDto) {
    return this.authService.loginWithMobile(dto);
  }

  @Post('verify-otp')
  @ApiOperation({
    summary: 'Verify Otp sent by PW on mobile number for login and signup',
  })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.mobile, dto.otp);
  }

  // auth.controller.ts
  @Post('signup/email')
  @ApiOperation({
    summary: 'Signup via email Id',
  })
  signupEmail(@Body() dto: EmailSignupDto) {
    return this.authService.signupWithEmail(dto);
  }

  @Post('login/email')
  @ApiOperation({
    summary: 'Login via email Id',
  })
  loginEmail(@Body() dto: EmailLoginDto) {
    return this.authService.loginWithEmail(dto);
  }

  @Post('verify-email-otp')
  @ApiOperation({
    summary: 'Verify Otp sent on email for login or signup',
  })
  verifyEmailOtp(@Body() dto: VerifyEmailOtpDto) {
    return this.authService.verifyEmailOtp(dto.email, dto.otp);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('complete-profile')
  @ApiOperation({
    summary: 'Complete profile as signup will only take mobile number or email',
    description: `Add name, organization and email if user logged in via mobile number or mobile number if user logged in via email.
    Add only one field which user want to add other then you have or user logged in via.
     exmaple - 
    "email":"exmaple.com",
     or
     mobile:"8788477728"
    `,
  })
  completeProfile(
    @Req() req,
    @Body() dto: CompleteProfileDto
  ) {
    console.log(req.user, dto)
    return this.authService.completeProfile(dto.mobile, dto.email, req.user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('link-mobile')
  @ApiOperation({
    summary: 'if user logged in via email and want to add mobile use this api otp will already sent to mobile number by complete profile api.',
  })
  linkMobile(@Req() req, @Body() dto: LinkMobileDto) {
    return this.authService.verifyAndLinkMobile(req.user.userId, dto.mobile, dto.otp);
  }


  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('link-email')
  @ApiOperation({
    summary: 'if user logged in via email and want to add email use this api otp will already sent to email by complete profile api.',
  })
  linkEmail(@Req() req, @Body() dto: VerifyEmailOtpDto) {
    return this.authService.verifyAndLinkEmail(req.user.userId, dto.email, dto.otp);
  }


  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  @ApiOperation({
    summary: 'use this api to change password only valid for email login method.',
  })
  async changePassword(
    @Req() req,
    @Body() body: ChangePasswordDto
  ) {
    const userId = req.user.userId
    return this.authService.changePassword(
      userId,
      body.currentPassword,
      body.newPassword
    )
  }


  @Post("forgot-password")
  @ApiOperation({
    summary: 'this api is valid for email login method and will send otp to registered email id',
  })
  async forgotPassword(@Body() body: ForgotPasswordDto) {

    return this.authService.forgotPassword(body.email)

  }

  @Post("reset-password")
  @ApiOperation({
    summary: 'reset password using this api it takes otp, email and new passwaord in body only for email.',
  })
  async resetPassword(
    @Body()
    body: ResetPasswordDto
  ) {

    return this.authService.resetPassword(
      body.email,
      body.otp,
      body.newPassword
    )

  }
}
