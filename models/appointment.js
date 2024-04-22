const mongoose = require("mongoose");

const appointmentSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  mechanic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  appointmentServices: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppointmentServices",
      required: true,
    },
  ],
  additionalService: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppointmentServices",
      required: true,
    },
  ],
  fullname: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  region: {
    type: String,
    // required: true,
  },
  province: {
    type: String,
    // required: true,
  },
  city: {
    type: String,
    // required: true,
  },
  barangay: {
    type: String,
    // required: true,
  },
  postalcode: {
    type: String,
    // required: true,
  },
  address: {
    type: String,
    // required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  fuel: {
    type: String,
    required: true,
  },
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
  appointmentStatus: [
    {
      status: {
        type: String,
        // required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      message: {
        type: String,
        // required: true,
      },
    },
  ],
  backJob: {
    comment: {
      type: String,
      // required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  totalPrice: {
    type: Number,
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  timeSlot: {
    type: String,
    required: true,
  },
  //   isPaid: {
  //     type: Boolean,
  //   },
  serviceType: {
    type: String,
    required: true,
  },
  employeeUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  parts: [
    {
      productName: {
        type: String,
      },
      brandName: {
        type: String,
      },
      quantity: {
        type: Number,
      },
      price: {
        type: Number,
      },
    },
  ],
  totalPartPrice: {
    type: Number,
  },
  mechanicProof: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  customerProof: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

appointmentSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

appointmentSchema.virtual("toJSON", {
  virtuals: true,
});

exports.Appointment = mongoose.model("Appointment", appointmentSchema);
