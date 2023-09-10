const Subscriber = require("../models/Subscriber");
const randomstring = require("randomstring");

exports.getSecurityKey = async () => {
  let isValid = false;
  let newKey = "";

  while (!isValid) {
    const key = randomstring.generate(8);

    const subscriber = await Subscriber.findOne({ secretKey: key });

    if (subscriber) {
      isValid = false;
    } else {
      isValid = true;
      newKey = key;
    }
  }

  return newKey;
};
