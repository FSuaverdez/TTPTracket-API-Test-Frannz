const Subscriber = require("../models/Subscriber");

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
