const mongoose = require("mongoose");

const courierSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
    },
    email: {
      type: String,
    },
    marketing: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

const Courier = mongoose.model("Courier", courierSchema);

module.exports = Courier;
