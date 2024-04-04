const mongoose = require("mongoose");

const priceHistorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

priceHistorySchema.virtual("id").get(function () {
  return this._id.toHexString();
});

priceHistorySchema.set("toJSON", {
  virtuals: true,
});

exports.PriceHistory = mongoose.model("PriceHistory", priceHistorySchema);

exports.priceHistorySchema = priceHistorySchema;
