const mongoose = require("mongoose");

const tempSubscriberSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
    },
    email: {
      type: String,
    },
    endDate: {
      type: Date,
      default: new Date().setDate(new Date().getDate() + 30),
    },
    locationType: {
      type: String,
    },
    marketing: {
      type: Boolean,
    },
    credit: {
      type: String,
      default: "20",
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
      default: "active",
    },
    receiveUpdate: {
      type: Boolean,
      default: true,
    },
    courierId: {
      type: String,
    },
    didSubscribe: {
      type: Boolean,
      default: false,
    },
    subscribed: {
      type: Boolean,
      default: false,
    },
    stripeSession: {
      type: String,
    },
    carrier: {
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

tempSubscriberSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const TempSubscriber = mongoose.model("TempSubscriber", tempSubscriberSchema);

module.exports = TempSubscriber;
