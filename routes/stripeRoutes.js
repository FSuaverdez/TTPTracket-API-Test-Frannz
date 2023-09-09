const express = require("express");
require("dotenv").config();
const { createCheckout } = require("../controller/stripeControler");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

router.post("/create-checkout", createCheckout);

module.exports = router;
