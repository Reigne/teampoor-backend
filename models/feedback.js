const mongoose = require("mongoose");

const feedbackSchema = mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    required: true,
  },
  mechanic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  comment: {
    type: String,
    // required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

feedbackSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

feedbackSchema.set("toJSON", {
  virtuals: true,
});

exports.Feedback = mongoose.model("Feedback", feedbackSchema);
