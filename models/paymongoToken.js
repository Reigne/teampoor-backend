const mongoose = require("mongoose");

const paymongoTokenSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.ObjectId,
    ref: "Order",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

paymongoTokenSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

paymongoTokenSchema.set("toJSON", {
  virtuals: true,
});

exports.PaymongoToken = mongoose.model("PaymongoToken", paymongoTokenSchema);

exports.paymongoTokenSchema = paymongoTokenSchema;
