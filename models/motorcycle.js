const mongoose = require("mongoose");

const motorcycleSchema = mongoose.Schema({
  brand: {
    type: String,
    required: true,
  },
  // model: {
  //   type: String,
  //   required: true,
  // },
  year: {
    type: String,
    required: true,
  },
  plateNumber: {
    type: String,
    required: true,
  },
  engineNumber: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  fuel: {
    type: String,
    required: true,
  },
  imagePlateNumber: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  imageMotorcycle: [
    {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
  ],
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

motorcycleSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

motorcycleSchema.set("toJSON", {
  virtuals: true,
});

exports.Motorcycle = mongoose.model("Motorcycle", motorcycleSchema);
