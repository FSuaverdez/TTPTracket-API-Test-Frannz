const mongoose = require("mongoose");

const subscriberSchema = new mongoose.Schema(
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
    nextDay: {
      type: Date,
    },
    remainingText: {
      type: String,
    },
    courierId: {
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

const Subscriber = mongoose.model("Subscriber", subscriberSchema);

module.exports = Subscriber;
