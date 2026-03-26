import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {

  private transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  async sendOtpEmail(email: string, otp: string) {
    await this.transporter.sendMail({
      from: `"Your App" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'Verify your email',
      html: `
        <h2>Your OTP is: ${otp}</h2>
        <p>This OTP will expire in 5 minutes.</p>
      `,
    });
  }

  async sendEmailWithPassword(email: string, password: string) {
    await this.transporter.sendMail({
      from: `"Your App" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'Your Account Password',
      html: `
      <h2>Welcome to Your App 🎉</h2>

      <p>Your account has been created successfully.</p>

      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>

      <p style="color:red;">
        ⚠️ Please login and change your password immediately for security.
      </p>

      <p>Thank you!</p>
    `,
    });
  }
}