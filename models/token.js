const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  verifyUser: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
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
  verificationTokenExpire: Date,
});

tokenSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

tokenSchema.set("toJSON", {
  virtuals: true,
});

exports.Token = mongoose.model("Token", tokenSchema);

exports.tokenSchema = tokenSchema;
