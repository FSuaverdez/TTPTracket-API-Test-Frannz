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

      const checkIfSent = await TempSubscriber.findOne({
        phoneNumber: tempSub.phoneNumber,
        isReminderSent: true,
      });

      if (checkIfSent) {
        return;
      }

      await sendSMS(
        updatedTempSub?.phoneNumber,
        `Test after 2 minutes`,
        "+18883015545"
      );

      await TempSubscriber.findByIdAndUpdate(updatedTempSub?._id, {
        isReminderSent: true,
      });
    } catch (error) {
      console.log(error?.message);
    }
  }, 60 * 1000 * 2);
};
