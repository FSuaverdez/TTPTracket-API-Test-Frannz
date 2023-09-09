const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const TempSubscriber = require("../models/TempSubscriber");
const Subscriber = require("../models/Subscriber");

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
      const tempSubscriber = await TempSubscriber.create({
        phoneNumber,
        locations,
        locationType,
        email,
        marketing,
        selectedDays,
        hasMaxDate,
        maxCheckDate,
        checkDays,
      });

      const successUrl = `${process.env.STRIPE_SUCCESS_URL}/subscribe/${tempSubscriber._id}`;

      const cancelUrl = process.env.STRIPE_CANCEL_URL;

      // const product = await stripe.products.retrieve(process.env.PRODUCT_ID);
      // const price = await stripe.prices.retrieve(product.default_price);

      // const session = await stripe.checkout.sessions.create({
      //   line_items: [
      //     {
      //       price_data: {
      //         currency: "usd",
      //         unit_amount: price.unit_amount,
      //         product_data: {
      //           name: product.name,
      //           images: [product?.images[0]],
      //         },
      //       },
      //       quantity: 1,
      //     },
      //   ],
      //   allow_promotion_codes: true,
      //   mode: "payment",
      //   success_url: successUrl,
      //   cancel_url: cancelUrl,
      // });
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: 20 * 100,
              product_data: {
                name: "TTPTracker Test",
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
