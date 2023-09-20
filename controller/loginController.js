const Subscriber = require("../models/Subscriber");
const FreeSubscriber = require("../models/FreeSubscriber");

exports.login = async (req, res) => {
  try {
    const { email, key } = req.body;

    const subscriber = await Subscriber.findOne({ email, secretKey: key });

    if (!subscriber) {
      res.status(404).json({ error: "Invalid Email or Key" });
      return;
    }

    if (subscriber.status != "active") {
      res.status(400).json({ error: "This subscriber is no longer active" });
      return;
    }

    res.status(200).json({
      subscriber,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.loginFree = async (req, res) => {
  try {
    const { email, key } = req.body;

    const subscriber = await FreeSubscriber.findOne({ email, secretKey: key });

    if (!subscriber) {
      res.status(404).json({ error: "Invalid Email or Key" });
      return;
    }

    res.status(200).json({
      subscriber,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
};
