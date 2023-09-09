require("dotenv").config();
const TempSubscriber = require("../models/TempSubscriber");
const { CourierClient } = require("@trycourier/courier");
const axios = require("axios");

const courier = CourierClient({
  authorizationToken: process.env.COURIER_TOKEN,
});

exports.sendEmail = async (email, id, courierId) => {
  setTimeout(async () => {
    const temp = await TempSubscriber.findById(id);

    if (temp.didSubscribe) {
      return;
    }
    if (courierId) {
      const config = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.COURIER_TOKEN}`,
        },
      };

      const { data: courierData } = await axios.get(
        `https://api.courier.com/profiles/${courierId}`,
        config
      );
      if (courierData?.profile?.custom?.subscribed) {
        return;
      }
    }

    await courier.send({
      message: {
        to: {
          email: email,
        },
        template: "0HCTFVZ3Q9MK0PJ8195HJ0SCBQWZ",
        data: {},
        routing: {
          method: "single",
          channels: ["email"],
        },
      },
    });
  }, 240000);
};

exports.testEmail = async (req, res) => {
  const { requestId } = await courier.send({
    message: {
      to: {
        email: "sfrannz@gmail.com",
      },
      template: "0HCTFVZ3Q9MK0PJ8195HJ0SCBQWZ",
      data: {},
      routing: {
        method: "single",
        channels: ["email"],
      },
    },
  });

  res.send({ requestId });
};
