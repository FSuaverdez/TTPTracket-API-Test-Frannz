const { sendSMS } = require("../utils/twilio");

exports.sendSmsWelcomeAlert = async (phoneNumber, assignednumber) => {
  try {
    const response = await sendSMS(
      phoneNumber,
      `TTPTracker 1 month - Locations can be updated with phone number on sign up page. To unsubscribe from alerts, just reply STOP. Msg&Data Rates May Apply.`,
      assignednumber
    );

    if (response) {
      console.log("SMS SENT :", response);
    }
  } catch (error) {
    console.log(error.message);
  }
};
