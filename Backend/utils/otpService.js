const axios = require("axios");

/**
 * Send OTP using Fast2SMS (Popular in India, affordable)
 * Alternative: You can use Twilio, MSG91, or other providers
 *
 * Fast2SMS Setup:
 * 1. Register at https://www.fast2sms.com/
 * 2. Get API key from dashboard
 * 3. Add to .env: OTP_SERVICE_API_KEY=your_fast2sms_api_key
 */

/**
 * Send OTP to mobile number using Fast2SMS
 * @param {String} mobile - 10-digit mobile number
 * @param {String} otp - 6-digit OTP
 * @returns {Promise<Object>} Response from SMS service
 */
const sendOTPFast2SMS = async (mobile, otp) => {
  try {
    const message = `Your OTP for College Admission Portal is ${otp}. Valid for 10 minutes. Do not share with anyone.`;

    const response = await axios.get("https://www.fast2sms.com/dev/bulkV2", {
      params: {
        authorization: process.env.OTP_SERVICE_API_KEY,
        variables_values: otp,
        route: "otp",
        numbers: mobile,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Fast2SMS Error:", error.response?.data || error.message);
    throw new Error("Failed to send OTP. Please try again.");
  }
};

/**
 * Send OTP using Twilio (International option)
 * Uncomment and use if you prefer Twilio
 *
 * Twilio Setup:
 * 1. Register at https://www.twilio.com/
 * 2. Get Account SID, Auth Token, and Phone Number
 * 3. Add to .env:
 *    TWILIO_ACCOUNT_SID=your_account_sid
 *    TWILIO_AUTH_TOKEN=your_auth_token
 *    TWILIO_PHONE_NUMBER=your_twilio_number
 */

/*
const twilio = require('twilio');

const sendOTPTwilio = async (mobile, otp) => {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const message = await client.messages.create({
      body: `Your OTP for College Admission Portal is ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${mobile}` // Add country code
    });

    return {
      success: true,
      data: message
    };
  } catch (error) {
    console.error('Twilio Error:', error);
    throw new Error('Failed to send OTP. Please try again.');
  }
};
*/

/**
 * Send OTP using MSG91 (Another popular Indian provider)
 */
/*
const sendOTPMSG91 = async (mobile, otp) => {
  try {
    const response = await axios.post(
      `https://api.msg91.com/api/v5/otp`,
      {
        template_id: process.env.MSG91_TEMPLATE_ID,
        mobile: mobile,
        authkey: process.env.MSG91_AUTH_KEY,
        otp: otp
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('MSG91 Error:', error);
    throw new Error('Failed to send OTP');
  }
};
*/

/**
 * Development mode - Just log OTP to console
 * Use this during development to avoid SMS costs
 */
const sendOTPDevelopment = async (mobile, otp) => {
  console.log("======================");
  console.log("DEVELOPMENT MODE - OTP");
  console.log("======================");
  console.log(`Mobile: ${mobile}`);
  console.log(`OTP: ${otp}`);
  console.log("======================");

  return {
    success: true,
    data: { message: "OTP logged to console (dev mode)" },
  };
};

/**
 * Main function to send OTP
 * Automatically switches between development and production
 */
const sendOTP = async (mobile, otp) => {
  // Use development mode if NODE_ENV is development
  if (process.env.NODE_ENV === "development") {
    return sendOTPDevelopment(mobile, otp);
  }

  // Production: Use Fast2SMS (or uncomment to use Twilio/MSG91)
  return sendOTPFast2SMS(mobile, otp);

  // Alternative: Use Twilio in production
  // return sendOTPTwilio(mobile, otp);

  // Alternative: Use MSG91 in production
  // return sendOTPMSG91(mobile, otp);
};

module.exports = {
  sendOTP,
};
