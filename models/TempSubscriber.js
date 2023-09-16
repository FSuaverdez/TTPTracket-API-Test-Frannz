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
    courierId: {
      type: String,
    },
    didSubscribe: {
      type: Boolean,
    },
    subscribed: {
      type: Boolean,
    },
    stripeSession: {
      type: String,
    },
    carrier: {
      type: String,
    },
    isReminderSent: {
      type: Boolean,
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

tempSubscriberSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const TempSubscriber = mongoose.model("TempSubscriber", tempSubscriberSchema);

module.exports = TempSubscriber;
