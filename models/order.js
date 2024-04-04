const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  orderItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderItem",
      required: true,
    },
  ],
  fullname: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  region: {
    type: String,
    required: true,
  },
  province: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  barangay: {
    type: String,
    required: true,
  },
  postalcode: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  orderStatus: [
    {
      status: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      message: {
        type: String,
        required: true,
      },
    },
  ],
  totalPrice: {
    type: Number,
  },
  customerUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  employeeUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
  },
  dateOrdered: {
    type: Date,
    default: Date.now,
  },
  dateReceived: {
    type: Date,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  // paymentImage: {
  //   public_id: {
  //     type: String,
  //   },
  //   url: {
  //     type: String,
  //   },
  // },
  isPaid: {
    type: Boolean,
    default: false,
  },
});

orderSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

orderSchema.virtual("toJSON", {
  virtuals: true,
});

exports.Order = mongoose.model("Order", orderSchema);
