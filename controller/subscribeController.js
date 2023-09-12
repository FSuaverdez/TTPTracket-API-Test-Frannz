const Subscriber = require("../models/Subscriber");
const TempSubscriber = require("../models/TempSubscriber");
const { getSecurityKey } = require("../services/generate-key");
const { sendSMS } = require("../utils/twilio");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { getAssignedNumber } = require("./assignController");

exports.subscribe = async (req, res) => {
  const { id } = req.params;

  try {
    const temp = await TempSubscriber.findById(id).lean();
    if (temp) {
      if (temp?.subscribed) {
        res.redirect(`${process.env.SUCCESS_URL}`);
        return;
      }

      const {
        phoneNumber,
        locations,
        locationType,
        email,
        marketing,
        selectedDays,
        hasMaxDate,
        maxCheckDate,
        checkDays,
      } = temp;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const session = await stripe.checkout.sessions.retrieve(
        temp?.stripeSession
      );

      if (session.payment_status !== "paid") {
        console.log("Unpaid");
        res.redirect(`${process.env.STRIPE_CANCEL_URL}`);
        return;
      }

      let assignedNumber = await getAssignedNumber();

      const secretKey = await getSecurityKey();

      const ip = req.headers["x-forwarded-for"]?.split(", ")?.[0];

      await Subscriber.create({
        phoneNumber,
        locations,
        locationType,
        email,
        marketing,
        selectedDays,
        hasMaxDate,
        maxCheckDate,
        checkDays,
        nextDay: new Date(tomorrow),
        stripeCustomerDetails: {
          email: session?.customer_details?.email,
          name: session?.customer_details?.name,
        },
        stripeSession: temp?.stripeSession,
        assignedNumber,
        endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        status: "active",
        // credit: "20",
        remainingText: "30",
        receiveUpdate: true,
        receiveEmail: true,
        secretKey,
        ip,
      });

      await TempSubscriber.findByIdAndUpdate(temp._id, {
        didSubscribe: true,
        subscribed: true,
      });

      const response = await sendSMS(
        temp.phoneNumber,
        `TTPTracker 1 month - Locations can be updated with phone number on sign up page. To unsubscribe from alerts, just reply STOP. Msg&Data Rates May Apply.`,
        assignedNumber
      );

      if (response) {
        console.log("SMS SENT :", response);
      }

      res.redirect(`${process.env.SUCCESS_URL}`);
      return;
    } else {
      res.status(404).json({ error: "No temp subscriber found" });
      return;
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.isSubscribed = async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    const subscriber = await Subscriber.findOne({ phoneNumber });

    res.status(200).json({ subscriber: subscriber ? true : false });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.updateSubscriber = async (req, res) => {
  try {
    const {
      phoneNumber,
      locations,
      locationType,
      email,
      marketing,
      selectedDays,
      hasMaxDate,
      maxCheckDate,
      checkDays,
      receiveUpdate,
      receiveEmail,
      secretKey,
    } = req.body;

    const exist = await Subscriber.findOne({ secretKey, email });

    if (!exist) {
      res.status(404).json({ error: "No subscriber found" });
      return;
    }

    if (exist.status != "active") {
      res.status(400).json({ error: "This subscriber is no longer active" });
      return;
    }

    const subscriber = await Subscriber.findOneAndUpdate(
      { secretKey, status: "active" },
      {
        phoneNumber,
        locations,
        email,
        locationType,
        marketing,
        selectedDays,
        hasMaxDate,
        maxCheckDate,
        checkDays,
        receiveUpdate,
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
