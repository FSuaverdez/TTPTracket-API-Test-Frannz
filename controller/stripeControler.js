const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const TempSubscriber = require("../models/TempSubscriber");
const Subscriber = require("../models/Subscriber");
const Courier = require("../models/Courier");
const axios = require("axios");
const { sendEmail } = require("./courierController");
const twilio = require("twilio");

const accountSid = process.env.TWILIO_SID; // Your Account SID from www.twilio.com/console
const authToken = process.env.TWILIO_TOKEN;

const client = require("twilio")(accountSid, authToken);

exports.checkCheckout = async (req, res) => {
  try {
    const { id } = req.params;

    const response = await stripe.checkout.sessions.retrieve(id);

    res.json(response);
  } catch (error) {
    res.status(400).json(error);
  }
};

exports.createCheckout = async (req, res) => {
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
  } = req.body;

  try {
    const exist = await Subscriber.findOne({ phoneNumber, status: "active" });

    if (exist) {
      const subscriber = await Subscriber.findOneAndUpdate(
        { phoneNumber },
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
        }
      );
      res.status(200).json({
        subscriber,
      });
    } else {
      const isExist = await Courier.findOne({ email });
      let courierId;
      if (!isExist) {
        const newCourier = await Courier.create({
          email,
          phoneNumber,
          marketing,
        });
        const config = {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.COURIER_TOKEN}`,
          },
        };
        const data = {
          profile: {
            email: email,
            phone_number: phoneNumber,
            custom: {
              marketing: marketing,
              subscribed: false,
            },
          },
        };
        const courierResponse = await axios.post(
          `https://api.courier.com/profiles/${newCourier._id}`,
          data,
          config
        );

        courierId = newCourier._id;
      } else {
        const updatedCourier = await Courier.findOneAndUpdate(isExist._id, {
          phoneNumber,
        });

        const config = {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.COURIER_TOKEN}`,
          },
        };

        const { data: courierData } = await axios.get(
          `https://api.courier.com/profiles/${isExist._id}`,
          config
        );

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
              subscribed: courierData?.profile?.custom?.subscribed
                ? true
                : false,
            },
          },
        ];
        await axios.patch(
          `https://api.courier.com/profiles/${updatedCourier._id}`,
          {
            patch: data,
          },
          config
        );

        courierId = updatedCourier._id;
      }

      const tempSubscriber = await TempSubscriber.create({
        phoneNumber,
        locations,
        locationType,
        email,
        marketing,
        courierId: courierId,
        selectedDays,
        hasMaxDate,
        maxCheckDate,
        checkDays,
      });

      // if (!isExist) {
      //   sendEmail(email, tempSubscriber._id, courierId);
      // }

      const successUrl = `${process.env.STRIPE_SUCCESS_URL}/subscribe/${tempSubscriber._id}`;

      const cancelUrl = process.env.STRIPE_CANCEL_URL;

      const product = await stripe.products.retrieve(process.env.PRODUCT_ID);
      const price = await stripe.prices.retrieve(product.default_price);

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: price.unit_amount,
              product_data: {
                name: product.name,
                images: [product?.images[0]],
              },
            },
            quantity: 1,
          },
        ],
        allow_promotion_codes: true,
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      await TempSubscriber.findByIdAndUpdate(tempSubscriber._id, {
        stripeSession: session.id,
      });

      res.status(200).json({ redirect_url: session.url });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};
