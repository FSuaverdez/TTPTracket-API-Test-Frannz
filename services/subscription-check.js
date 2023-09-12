const Subscriber = require("../models/Subscriber");
const TempSubscriber = require("../models/TempSubscriber");
const { sendSMS } = require("../utils/twilio");

exports.checkSubscription = (tempSub) => {
  setTimeout(async () => {
    try {
      const subscriber = await Subscriber.findOne({
        phoneNumber: tempSub.phoneNumber,
      });

      if (subscriber) {
        return;
      }

      const updatedTempSub = await TempSubscriber.findById(tempSub._id);

      if (updatedTempSub?.didSubscribe) {
        return;
      }

      await sendSMS(
        updatedTempSub?.phoneNumber,
        `Test after 2 minutes`,
        "+19178325169"
      );
    } catch (error) {
      console.log(error?.message);
    }
  }, 60 * 1000 * 2);
};
