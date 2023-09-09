const Subscriber = require("../models/Subscriber");
const Courier = require("../models/Courier");
const TempSubscriber = require("../models/TempSubscriber");
const { sendSMS } = require("../utils/twilio");
require("dotenv").config();
const axios = require("axios");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { sendEmail } = require("./courierController");
const twilio = require("twilio");
const { getAssignedNumber } = require("./assignController");

const accountSid = process.env.TWILIO_SID; // Your Account SID from www.twilio.com/console
const authToken = process.env.TWILIO_TOKEN;

const client = require("twilio")(accountSid, authToken);
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
        courierId,
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

      let carrier = "";

      // try {
      //   let checkNumberResponse = await client.lookups.v1
      //     .phoneNumbers(phoneNumber)
      //     .fetch({ type: ["carrier"] });
      //   carrier = checkNumberResponse?.carrier?.name;
      // } catch (error) {}

      let assignedNumber = await getAssignedNumber();

      await Subscriber.create({
        phoneNumber,
        locations,
        locationType,
        email,
        marketing,
        courierId,
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
        carrier,
        assignedNumber,
        endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        status: "active",
        // credit: "20",
        remainingText: "30",
        receiveUpdate: true,
      });

      await TempSubscriber.findByIdAndUpdate(temp._id, {
        didSubscribe: true,
        subscribed: true,
      });

      const config = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.COURIER_TOKEN}`,
        },
      };
      const data = [
        {
          op: "replace",
          path: "/phone_number",
          value: phoneNumber,
        },
        {
          op: "replace",
          path: "/email",
          value: email,
        },
        {
          op: "replace",
          path: "/custom",
          value: {
            marketing: marketing,
            subscribed: true,
          },
        },
      ];
      await axios.patch(
        `https://api.courier.com/profiles/${courierId}`,
        {
          patch: data,
        },
        config
      );

      const response = await sendSMS(
        temp.phoneNumber,
        `TTPTracker 1 month - Locations can be updated with phone number on sign up page. To unsubscribe from alerts, just reply STOP. Msg&Data Rates May Apply.`,
        assignedNumber
      );
      if (response) {
        console.log(new Date().toLocaleTimeString(), " SMS SENT :", response);
      }
      res.redirect(`${process.env.SUCCESS_URL}`);
      return;
    } else {
      res.status(404).json({ error: "No temp subscriber found" });
      return;
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.isSubscribed = async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    const subscriber = await Subscriber.findOne({ phoneNumber });

    res.status(200).json({ subscriber: subscriber ? true : false });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};
