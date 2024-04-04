const mongoose = require("mongoose");

const serviceSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    default: "",
  },
  // category: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "ServiceCategory",
  //   required: true,
  // },
  images: [
    {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
  ],
  type: {
    type: Number,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

serviceSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

serviceSchema.set("toJSON", {
  virtuals: true,
});

exports.Service = mongoose.model("Service", serviceSchema);
