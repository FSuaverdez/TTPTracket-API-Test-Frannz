const Subscriber = require("../models/Subscriber");
const TempSubscriber = require("../models/TempSubscriber");

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

      console.log(
        `${updatedTempSub.phoneNumber} did not subscribe after 2 minutes sending a sms reminder`
      );
    } catch (error) {
      console.log(error?.message);
    }
  }, 60 * 1000 * 2);
};
