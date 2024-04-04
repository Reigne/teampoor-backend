const mongoose = require("mongoose");

const fuelSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  motorcycle: {
    type: mongoose.Schema.ObjectId,
    ref: "Motorcycle",
    required: true,
  },
  odometer: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  totalCost: {
    type: Number,
    required: true,
  },
  fillingStation: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
//   AttachImage: {
//     public_id: {
//       type: String,
//     },
//     url: {
//       type: String,
//     },
//   },
});

fuelSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

fuelSchema.virtual("toJSON", {
  virtuals: true,
});

exports.Fuel = mongoose.model("Fuel", fuelSchema);
