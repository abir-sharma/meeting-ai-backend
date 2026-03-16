import { Injectable, BadRequestException, ConflictException } from '@nestjs/common'
import axios from 'axios'

@Injectable()
export class PwAuthService {

    private organizationId = "5eb393ee95fab7468a79d189"

    async registerMobile(mobile: string, firstName: string, lastName: string) {
  try {

    const res = await axios.post(
      `https://api.penpencil.co/v1/users/register/${this.organizationId}`,
      {
        mobile,
        countryCode: "+91",
        firstName,
        lastName
      }
    )

    return res.data

  } catch (error: any) {

    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      "Mobile registration failed"


    if (message.toLowerCase().includes("exist")) {
      throw new ConflictException(message)
    }

    throw new BadRequestException(message)
  }
}

    async sendOtp(mobile: string) {
        const phone = mobile;
        try {
            
            const res = await axios.post("https://api.penpencil.co/v1/users/get-otp?smsType=0", {
                username: phone,
                countryCode: "+91",
                organizationId: this.organizationId,
                // "Client-Type": "WEB",
            })

            return res.data

        } catch (error) {
            console.error("PW OTP Error:", error.response?.data || error.message)
            if (error) {
                const message =
                    error.response?.data?.error?.message ||
                    error.response?.data?.message ||
                    error.message ||
                    "OTP service failed"

                throw new BadRequestException(message)
            }

            throw error
        }
    }

    async verifyOtp(mobile: string, otp: string) {

        try {

            const res = await axios.post(
                "https://api.penpencil.co/v3/oauth/token",
                {
                    username: mobile,
                    otp,
                    client_id: "system-admin",
                    client_secret: "KjPXuAVfC5xbmgreETNMaL7z",
                    grant_type: "password",
                    organizationId: this.organizationId,
                    latitude: 0,
                    longitude: 0
                }
            )

            return res.data

        } catch (error) {

            if (error.response?.data) {
                throw new BadRequestException(error.response.data.message)
            }

            throw error
        }
    }
}