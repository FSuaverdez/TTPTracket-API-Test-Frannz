const FreeSubscriber = require("../models/FreeSubscriber");
const { getSecurityKey } = require("../services/generate-key");
const { sendTemplateEmail } = require("../services/send-grid");
require("dotenv").config();
const { getAssignedNumber } = require("./assignController");

exports.subscribeFree = async (req, res) => {
  try {
    const { locations, locationType, email } = req.body;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    let assignedNumber = await getAssignedNumber();

    const secretKey = await getSecurityKey();

    const ip = req.headers["x-forwarded-for"]?.split(", ")?.[0];

    const checkIp = await FreeSubscriber.find({ ip });

    if (checkIp.length > 0) {
      res.status(400).json({
        error:
          "You can have one free email alert account. To enjoy extended features, consider subscribing to our premium alerts here.",
      });
      return;
    }

    await FreeSubscriber.create({
      locations,
      locationType,
      email,
      nextDay: new Date(tomorrow),
      assignedNumber,
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      status: "active",
      remainingText: "30",
      remainingEmail: "30",
      receiveUpdate: false,
      receiveEmail: true,
      limitEmail: false,
      secretKey,
      ip,
    });

    const dynamicTemplateData = {
      secretKey: secretKey,
    };

    await sendTemplateEmail(
      email,
      process.env.SENDGRID_FREE_SUBSCRIBED_TEMPLATE,
      dynamicTemplateData
    );
    res.status(201).json({ message: "success" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.updateFreeSubscriber = async (req, res) => {
  try {
    const { locations, locationType, email, receiveEmail, secretKey } =
      req.body;

    const exist = await FreeSubscriber.findOne({ secretKey, email });

    if (!exist) {
      res.status(404).json({ error: "No subscriber found" });
      return;
    }

    if (exist.status != "active") {
      res.status(400).json({ error: "This subscriber is no longer active" });
      return;
    }

    const subscriber = await FreeSubscriber.findOneAndUpdate(
      { secretKey, status: "active" },
      {
        locations,
        email,
        locationType,
        receiveEmail,
      }
    );

    res.status(200).json({
      subscriber,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
};
