import AWS from 'aws-sdk'
import { config } from '../config'

// Configure AWS SNS
const sns = new AWS.SNS({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region,
})

/**
 * Generate a random 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Send OTP via AWS SNS
 * @param phoneNumber - Phone number in E.164 format
 * @param code - 6-digit OTP code
 * @returns Promise<boolean> - Success status
 */
export async function sendOTP(
  phoneNumber: string,
  code: string
): Promise<boolean> {
  try {
    const message = `Your KZTE Splits verification code is: ${code}. Valid for 10 minutes.`

    const params: AWS.SNS.PublishInput = {
      Message: message,
      PhoneNumber: phoneNumber,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: config.aws.snsSenderId,
        },
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional',
        },
      },
    }

    // In development mode, just log the OTP instead of sending
    if (config.nodeEnv === 'development') {
      console.log(`[DEV MODE] OTP for ${phoneNumber}: ${code}`)
      return true
    }

    await sns.publish(params).promise()
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
