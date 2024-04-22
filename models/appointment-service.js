const mongoose = require("mongoose");

const AppointmentServicesSchema = mongoose.Schema({
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

AppointmentServicesSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Fix: toJSON should be a function, not an object
AppointmentServicesSchema.set("toJSON", {
  virtuals: true,
});

exports.AppointmentServices = mongoose.model(
  "AppointmentServices",
  AppointmentServicesSchema
);
