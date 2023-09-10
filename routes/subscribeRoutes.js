const express = require("express");
require("dotenv").config();
const {
  subscribe,
  isSubscribed,
  updateSubscriber,
} = require("../controller/subscribeController");

const router = express.Router();

router.get("/:id", subscribe);
router.patch("/", updateSubscriber);
router.post("/subscribe-status", isSubscribed);

module.exports = router;
