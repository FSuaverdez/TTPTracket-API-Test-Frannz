const express = require("express");
require("dotenv").config();
const {
  updateFreeSubscriber,
  subscribeFree,
} = require("../controller/freeSubscribeController");

const router = express.Router();

router.post("/subscribe", subscribeFree);
router.patch("/subscribe", updateFreeSubscriber);

module.exports = router;
