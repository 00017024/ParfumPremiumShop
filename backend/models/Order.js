const mongoose = require("mongoose");
const { UZ_PHONE_REGEX, UZ_PHONE_MESSAGE } = require('../validators/phone');

const ORDER_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  CONFIRMED: "CONFIRMED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED"
};

const ORDER_TRANSITIONS = {
  PENDING: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED],
  PAID: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  CONFIRMED: [ORDER_STATUS.COMPLETED],
  COMPLETED: [],
  CANCELLED: []
};

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    customerName: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      match: [UZ_PHONE_REGEX, UZ_PHONE_MESSAGE],
    },

    city: {
      type: String,
      enum: ["Tashkent", "Samarkand"],
      required: true
    },

    notes: {
      type: String
    },

    location: {
      lat: { type: Number },
      lng: { type: Number },
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        }
      }
    ],

    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING
    }
  },
  { timestamps: true }
);

// lifecycle guard
orderSchema.methods.canTransitionTo = function (nextStatus) {
  const allowed = ORDER_TRANSITIONS[this.status] || [];
  return allowed.includes(nextStatus);
};

const Order = mongoose.model("Order", orderSchema);

module.exports = {
  Order,
  ORDER_STATUS
};