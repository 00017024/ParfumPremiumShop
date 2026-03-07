const mongoose = require("mongoose");

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

//Lifecycle guard

orderSchema.methods.canTransitionTo = function (nextStatus) {
  const allowed = ORDER_TRANSITIONS[this.status] || [];
  return allowed.includes(nextStatus);
};

const Order = mongoose.model("Order", orderSchema);

// Export named exports for clarity: { Order, ORDER_STATUS }
module.exports = {
  Order,
  ORDER_STATUS
};
