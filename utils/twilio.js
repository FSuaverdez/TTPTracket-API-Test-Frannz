const twilio = require("twilio");
require("dotenv").config();
const Subscriber = require("../models/Subscriber");
const { MessagingResponse } = require("twilio").twiml;

const accountSid = process.env.TWILIO_SID; // Your Account SID from www.twilio.com/console
const authToken = process.env.TWILIO_TOKEN;

const client = require("twilio")(accountSid, authToken);

const optOutWords = new Set([
  "stop",
  "cancel",
  "end",
  "quit",
  "unsubscribe",
  "stopall",
]);

const optInWords = new Set(["start", "yes", "unstop"]);

exports.sendSMS = async (phoneNumber, message, assignedNumber, subscriber) => {
  try {
    const response = await client.messages.create({
      body: message,
      to: phoneNumber, // Text this number
      from: assignedNumber,
    });

    return response.sid;
  } catch (e) {
    if (
      String(e?.message).includes("Attempt to send to unsubscribed recipient")
    ) {
      console.log("Attempt to send to unsubscribed recipient");
      if (subscriber) {
        try {
          console.log("Attempting to set receiveUpdate to false");
          await Subscriber.findByIdAndUpdate(subscriber?._id, {
            receiveUpdate: false,
          });
          console.log("receiveUpdate set to false Successfully");
        } catch (error) {
          console.log(error?.message);
        }
    
      }
    } else {
      console.log(e?.message);
    }
  }
};

exports.twilioHook = async (req, res) => {
  try {
    const { Body, From } = req.body;

    if (optOutWords.has(Body.trim().toLowerCase())) {
      await Subscriber.findOneAndUpdate(
        {
          phoneNumber: From,
          status: "active",
        },
        {
          receiveUpdate: false,
        }
      );
    } else if (optInWords.has(Body.trim().toLowerCase())) {
      await Subscriber.findOneAndUpdate(
        {
          phoneNumber: From,
          status: "active",
        },
        {
          receiveUpdate: true,
        }
      );
    }
  } catch (e) {
    console.log(e?.message);
  }
};

exports.testSMS = async (req, res) => {
  try {
    const response = await client.messages.create({
      body: "This is from node",
      to: "+19178325169", // Text this number
      from: process.env.TWILIO_NUMBER, // From a valid Twilio number
    });

    res.json(response);
  } catch (e) {
    console.log(e);
    res.json(e);
  }
};

exports.checkMobileNumber = async (req, res) => {
  const phoneNumber = "+14252836092";
  try {
    const response = await client.lookups.v1
      .phoneNumbers(phoneNumber)
      .fetch({ type: ["carrier"] });

    const from =
      response.carrier.name !== "AT&T Wireless"
        ? process.env.TWILIO_NUMBER
        : process.env.TWILIO_NUMBER2;

    res.json({ response, from });
  } catch (error) {
    console.log(error);
    res.json(error);
  }
};
