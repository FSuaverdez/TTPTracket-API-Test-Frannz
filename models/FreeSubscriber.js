const mongoose = require("mongoose");

const freeSubscriberSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
    },
    email: {
      type: String,
    },
    endDate: {
      type: Date,
    },
    locationType: {
      type: String,
    },
    marketing: {
      type: Boolean,
    },
    credit: {
      type: String,
    },
    selectedDays: [String],
    checkDays: {
      type: Boolean,
    },
    hasMaxDate: {
      type: Boolean,
    },
    maxCheckDate: {
      type: Date,
    },
    status: {
      type: String,
    },
    receiveUpdate: {
      type: Boolean,
    },
    receiveEmail: {
      type: Boolean,
    },
    nextDay: {
      type: Date,
    },
    remainingText: {
      type: String,
    },
    stripeSession: {
      type: String,
    },
    stripeCustomerDetails: {
      email: String,
      name: String,
    },
    carrier: {
      type: String,
    },
    assignedNumber: {
      type: String,
    },
    secretKey: {
      type: String,
    },
    ip: {
      type: String,
    },
    locations: [
      {
        locationId: {
          type: String,
        },
        name: {
          type: String,
        },
        city: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const FreeSubscriber = mongoose.model("FreeSubscriber", freeSubscriberSchema);

module.exports = FreeSubscriber;
