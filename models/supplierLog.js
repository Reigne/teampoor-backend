const mongoose = require("mongoose");

const supplierLogSchema = new mongoose.Schema({
  products: [
    {
      // product: {
      //   type: mongoose.Schema.ObjectId,
      //   ref: "Product",
      //   required: true,
      // },
      productName: {
        type: String,
        required: true,
      },
      brandName: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  totalPrice: {
    type: Number,
    required: true,
  },
  invoiceId: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
    // required: true,
  },
  dateDelivered: {
    type: Date,
    required: true,
  },
  supplier: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
});

supplierLogSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

supplierLogSchema.set("toJSON", {
  virtuals: true,
});

exports.SupplierLog = mongoose.model("SupplierLog", supplierLogSchema);
