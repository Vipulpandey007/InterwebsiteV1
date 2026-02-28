/**
 * SMS Service
 * Handles sending OTP via SMS
 * Currently configured for development mode (console logging)
 * Can be extended to use Twilio, AWS SNS, or other SMS providers
 */

/**
 * Send OTP via SMS
 * @param {string} mobile - Mobile number (10 digits)
 * @param {string} otp - OTP code (6 digits)
 * @returns {Promise<boolean>}
 */
const sendOTP = async (mobile, otp) => {
  try {
    // ===== DEVELOPMENT MODE =====
    // In development, just log to console
    if (process.env.NODE_ENV === "development" || !process.env.SMS_PROVIDER) {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📱 SMS SERVICE (DEVELOPMENT MODE)");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`📞 Mobile: +91 ${mobile}`);
      console.log(`🔐 OTP: ${otp}`);
      console.log(`⏰ Valid for: 10 minutes`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      return true;
    }

    // ===== PRODUCTION MODE =====
    // Uncomment and configure your SMS provider below

    /*
    // OPTION 1: TWILIO
    const twilioClient = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await twilioClient.messages.create({
      body: `Your OTP for College Admission is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${mobile}`
    });
    */

    /*
    // OPTION 2: AWS SNS
    const AWS = require('aws-sdk');
    const sns = new AWS.SNS({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });

    await sns.publish({
      Message: `Your OTP for College Admission is: ${otp}. Valid for 10 minutes.`,
      PhoneNumber: `+91${mobile}`,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional'
        }
      }
    }).promise();
    */

    /*
    // OPTION 3: MSG91
    const axios = require('axios');
    
    await axios.get(`https://api.msg91.com/api/v5/otp`, {
      params: {
        authkey: process.env.MSG91_AUTH_KEY,
        mobile: `91${mobile}`,
        otp: otp,
        template_id: process.env.MSG91_TEMPLATE_ID
      }
    });
    */

    /*
    // OPTION 4: CUSTOM SMS GATEWAY
    const axios = require('axios');
    
    await axios.post(process.env.SMS_GATEWAY_URL, {
      mobile: mobile,
      message: `Your OTP for College Admission is: ${otp}. Valid for 10 minutes.`,
      apiKey: process.env.SMS_API_KEY
    });
    */

    return true;
  } catch (error) {
    console.error("SMS Send Error:", error);
    // In development, still return true so app doesn't break
    if (process.env.NODE_ENV === "development") {
      return true;
    }
    throw error;
  }
};

/**
 * Send SMS notification
 * @param {string} mobile - Mobile number
 * @param {string} message - Message to send
 * @returns {Promise<boolean>}
 */
const sendSMS = async (mobile, message) => {
  try {
    // Development mode - just log
    if (process.env.NODE_ENV === "development" || !process.env.SMS_PROVIDER) {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📱 SMS NOTIFICATION (DEV MODE)");
      console.log(`📞 To: +91 ${mobile}`);
      console.log(`💬 Message: ${message}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      return true;
    }

    // Production - use your SMS provider
    // Add your SMS sending logic here

    return true;
  } catch (error) {
    console.error("SMS Send Error:", error);
    if (process.env.NODE_ENV === "development") {
      return true;
    }
    throw error;
  }
};

module.exports = {
  sendOTP,
  sendSMS,
};
