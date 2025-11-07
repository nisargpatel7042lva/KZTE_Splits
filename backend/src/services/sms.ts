import twilio from 'twilio'
import { config } from '../config'

// Configure Twilio client (lazy to avoid constructing in tests when not needed)
function getTwilioClient() {
  if (!config.twilio.accountSid || !config.twilio.authToken) {
    throw new Error('Twilio credentials are not configured')
  }
  return twilio(config.twilio.accountSid, config.twilio.authToken)
}

/**
 * Generate a random 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Send OTP via Twilio SMS
 * @param phoneNumber - Phone number in E.164 format
 * @param code - 6-digit OTP code
 * @returns Promise<boolean> - Success status
 */
export async function sendOTP(
  phoneNumber: string,
  code: string
): Promise<boolean> {
  try {
    const body = `Your KZTE Splits verification code is: ${code}. Valid for 10 minutes.`

    // In development mode, just log the OTP instead of sending
    if (config.nodeEnv === 'development') {
      console.log(`[DEV MODE] OTP for ${phoneNumber}: ${code}`)
      return true
    }

    const client = getTwilioClient()

    // Prefer Messaging Service SID if configured, else use fromNumber
    const messagingOptions: any = {
      to: phoneNumber,
      body,
    }

    if (config.twilio.messagingServiceSid) {
      messagingOptions.messagingServiceSid = config.twilio.messagingServiceSid
    } else if (config.twilio.fromNumber) {
      messagingOptions.from = config.twilio.fromNumber
    } else {
      throw new Error('Twilio from number or messaging service SID is required')
    }

    await client.messages.create(messagingOptions)
    return true
  } catch (error) {
    console.error('Error sending OTP:', error)
    return false
  }
}

/**
 * Validate phone number format (Kazakhstan +7 format)
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+7\d{10}$/
  return phoneRegex.test(phone)
}
