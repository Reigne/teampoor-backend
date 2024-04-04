const mongoose = require("mongoose");

const appointmentServiceSchema = mongoose.Schema({
  // note: [
  //   {
  //     remark: {
  //       type: String,
  //     },
  //   },
  // ],
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
  },
});

appointmentServiceSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Fix: toJSON should be a function, not an object
appointmentServiceSchema.set("toJSON", {
  virtuals: true,
});

exports.AppointmentService = mongoose.model(
  "AppointmentService",
  appointmentServiceSchema
);
