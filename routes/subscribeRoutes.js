const express = require("express");
require("dotenv").config();
const {
  subscribe,
  isSubscribed,
} = require("../controller/subscribeController");

const router = express.Router();

router.get("/:id", subscribe);
router.post("/subscribe-status", isSubscribed);

module.exports = router;
