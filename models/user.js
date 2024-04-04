const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
  },
  birthday: {
    type: Date,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  // addresses: [
  //   {
  //     region: {
  //       type: String,
  //     },
  //     province: {
  //       type: String,
  //     },
  //     city: {
  //       type: String,
  //     },
  //     barangay: {
  //       type: String,
  //     },
  //     postalcode: {
  //       type: String,
  //     },
  //     address: {
  //       type: String,
  //     },
  //   },
  // ],
  avatar: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  role: {
    type: String,
    default: "user",
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

userSchema.set("toJSON", {
  virtuals: true,
});

exports.User = mongoose.model("User", userSchema);

exports.userSchema = userSchema;
