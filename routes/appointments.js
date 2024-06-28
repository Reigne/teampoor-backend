const { Appointment } = require("../models/appointment");
const { AppointmentServices } = require("../models/appointment-service");
const { Service } = require("../models/service");
const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const multer = require("multer");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary");
const { Product } = require("../models/product");
const { Feedback } = require("../models/feedback");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid image type");

    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

//get all appointments
router.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate({
        path: "user",
      })
      .populate({
        path: "appointmentServices",
        populate: { path: "service", model: "Service" },
      })
      .sort({ dateOrdered: -1 })
      .lean();

    console.log(appointments, "appointments");

    if (!appointments) {
      return res.status(500).json({ success: false });
    }

    res.send(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Fetch appointments by user ID
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const appointments = await Appointment.find({ user: userId })
      .populate({
        path: "user",
      })
      .populate({
        path: "mechanic", // Populate the mechanic field
        model: "User", // Model to populate from
      })
      .populate({
        path: "appointmentServices",
        populate: { path: "service", model: "Service" },
      })
      .sort({ dateOrdered: -1 })
      .lean();

    console.log(appointments, "appointments");

    if (!appointments) {
      return res.status(500).json({ success: false });
    }

    res.send(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

//create appointment by user
router.post("/", async (req, res) => {
  try {
    console.log(req.body, "inputs");

    const validationErrors = [];

    const user = await User.findOne({ _id: req.body.user });

    if (!user) {
      return res.status(400).send("The user not found");
    }

    // const AppointmentServices = [];

    const serviceItemsIds = await Promise.all(
      req.body.serviceSelected.map(async (serviceItem) => {
        const service = await Service.findById(serviceItem.id);

        if (!service) {
          validationErrors.push(`Service with ID ${serviceItem.id} not found.`);
          return null;
        }

        if (service.isAvailable === false) {
          validationErrors.push(`Service ${service.name} is not available.`);
          return null;
        }

        let newAppointmentService = new AppointmentServices({
          service: serviceItem.id,
        });

        newAppointmentService = await newAppointmentService.save();

        return newAppointmentService._id;
      })
    );

    // Check if there were validation errors
    if (validationErrors.length > 0) {
      console.log(validationErrors);
      return res.status(400).send(validationErrors.join("\n"));
    }

    const initialOrderStatus = {
      // Add the initial status when creating the order
      status: req.body.status || "PENDING",
      timestamp: new Date(),
      message: "Appointment successfully placed.", // You can customize the initial message
    };

    let appointment = new Appointment({
      appointmentServices: serviceItemsIds,
      user: req.body.user,
      fullname: req.body.fullname,
      phone: req.body.phone,

      region: req.body.region || "",
      province: req.body.province || "",
      city: req.body.city || "",
      barangay: req.body.barangay || "",
      postalcode: req.body.postalcode || "",
      address: req.body.address || "",

      brand: req.body.brand,
      fuel: req.body.fuel,
      year: req.body.year,
      plateNumber: req.body.plateNumber,
      engineNumber: req.body.engineNumber,
      type: req.body.type,
      brand: req.body.brand,

      serviceType: req.body.serviceType,
      appointmentStatus: [initialOrderStatus], // Include the initial order status
      totalPrice: req.body.totalPrice,
      appointmentDate: req.body.serviceCart.date,
      timeSlot: req.body.serviceCart.timeSlot,
      // eWallet: req.body.eWallet ? req.body.eWallet : null,
    });

    appointment = await appointment.save();

    const appointmentObject = appointment.toObject();

    console.log(appointment, "this is order");

    // sendEmail(user, order, orderItemsDetails);

    return res.send(appointmentObject);

    // return res.status(200).json({
    //   success: true,
    //   message: "Mechanic assigned successfully",
    //   appointment,
    // });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});

//get single appointment
router.get("/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({
        path: "user",
      })
      .populate({
        path: "mechanic",
      })
      .populate({
        path: "appointmentServices",
        populate: { path: "service", model: "Service" },
      })
      .sort({ dateOrdered: -1 })
      .lean();

    console.log(appointment, "appointment");

    if (!appointment) {
      return res.status(500).json({ success: false });
    }

    res.send(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Add additional service to existing appointment
router.put("/add-service/:id", async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const serviceId = req.body.id;

    if (!serviceId) {
      return res.status(400).json({ error: "Service ID is required" });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(400).json({ error: "Appointment not found" });
    }

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(400).json({ error: "Service not found" });
    }

    if (!service.isAvailable) {
      return res.status(400).json({ error: "Service not available" });
    }

    let newAppointmentService = new AppointmentServices({
      service: serviceId,
    });

    newAppointmentService = await newAppointmentService.save();

    appointment.appointmentServices.push(newAppointmentService._id);
    await appointment.save();

    // Recalculate the total price based on all services associated with the appointment
    const appointmentServices = await AppointmentServices.find({ _id: { $in: appointment.appointmentServices } }).populate('service');
    let totalPrice = 0;
    appointmentServices.forEach((appointmentService) => {
      totalPrice += appointmentService.service.price;
    });

    // Update the appointment with the new totalPrice
    appointment.totalPrice = totalPrice;
    await appointment.save();

    // Fetch the updated appointment details
    const updatedAppointment = await Appointment.findById(appointmentId).lean();

    res.status(200).json({
      success: true,
      message: "New Service Added",
      data: updatedAppointment,
    });
  } catch (error) {
    console.error("Error adding service:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Delete Service from Appointment
router.delete("/delete-service/:id", async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const serviceId = req.body.id;

    console.log("Service ID:", serviceId);

    if (!serviceId) {
      return res.status(400).json({ error: "Service ID is required" });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(400).json({ error: "Appointment not found" });
    }

    const serviceIndex = appointment.appointmentServices.findIndex((service) =>
      service.equals(serviceId)
    );

    console.log(serviceIndex, "service index");

    if (serviceIndex === -1) {
      return res
        .status(400)
        .json({ error: "Service not found in appointment" });
    }

    // Remove the service from the appointment
    appointment.appointmentServices.splice(serviceIndex, 1);
    await appointment.save();

    // Remove the service document from AppointmentServices collection
    await AppointmentServices.findByIdAndRemove(serviceId);

    // Recalculate the total price based on remaining services
    const appointmentServices = await AppointmentServices.find({ _id: { $in: appointment.appointmentServices } }).populate('service');
    let totalPrice = 0;
    appointmentServices.forEach((appointmentService) => {
      totalPrice += appointmentService.service.price;
    });

    // Update the appointment with the new totalPrice
    appointment.totalPrice = totalPrice;
    await appointment.save();

    // Fetch the updated appointment details
    const updatedAppointment = await Appointment.findById(appointmentId).lean();

    res.status(200).json({
      success: true,
      message: "Service Deleted",
      data: updatedAppointment,
    });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Update the status of an appointment
router.put("/update/:id", async (req, res) => {
  try {
    // Find the appointment by its ID in the database
    const appointment = await Appointment.findById(req.params.id);

    // Check if the appointment exists
    if (!appointment) {
      // If not found, return a 404 error
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    console.log("appoint", appointment);

    // Extract the status details from the request body
    const { status } = req.body;

    let message = "";

    if (status === "PENDING") {
      message =
        "Appointment scheduled successfully. Awaiting for confirmation.";
    } else if (status === "CONFIRMED") {
      message = "Appointment confirmed. See you at the scheduled time!";
    } else if (status === "INPROGRESS") {
      message = "Service in progress. Your motorcycle is being serviced.";
    } else if (status === "DONE") {
      message = "Mechanic has completed servicing. Final checks in progress.";
    } else if (status === "COMPLETED") {
      message = "Service completed.";
    } else if (status === "CANCELLED") {
      message =
        "Appointment cancelled. Please contact us for further assistance.";
    } else if (status === "RESCHEDULED") {
      message =
        "Appointment rescheduled successfully. New date and time confirmed.";
    } else if (status === "DELAYED") {
      message =
        "Apologies for the delay. Your appointment is being rescheduled.";
    } else if (status === "NOSHOW") {
      message = "You missed your appointment. Please reschedule if needed.";
    } else if (status === "BACKJOBPENDING") {
      message = "Back job requested. We will process your request shortly.";
    } else if (status === "BACKJOBCONFIRMED") {
      message =
        "Back job confirmed. Please proceed with the scheduled back job.";
    } else if (status === "BACKJOBCOMPLETED") {
      message = "Back job completed successfully. Thank you!";
    } else if (status === "DONE") {
      message = "Mechanic has completed servicing. Final checks in progress.";
    } else if (status === "") {
      message = "You have marked the appointment as completed.";
    }

    // Create a new status object
    const newStatus = {
      status,
      message,
      timestamp: new Date(), // Timestamp of the update
    };

    // Push the new status object into the appointmentStatus array
    appointment.appointmentStatus.push(newStatus);

    // Save the updated appointment to the database
    await appointment.save();

    // Extract only the necessary information to send in the response
    const responseData = {
      _id: appointment._id,
      appointmentStatus: appointment.appointmentStatus, // You may choose to send only the updated status array
    };

    // If successful, send a success response with the extracted data
    res.status(200).json({
      success: true,
      message: "Appointment status updated successfully",
      data: responseData,
    });
  } catch (error) {
    // If an error occurs during the process, handle it and return a 500 error
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// request back job by customer
router.put("/backjob/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    const newStatus = {
      status: "BACKJOBPENDING",
      message: "Back job requested. We will process your request shortly.",
      timestamp: new Date(),
    };

    appointment.appointmentStatus.push(newStatus);

    appointment.backJob.comment = req.body.comment;
    appointment.backJob.createdAt = Date.now();

    await appointment.save();

    console.log("backjob", appointment);

    const responseData = {
      _id: appointment._id,
      appointmentStatus: appointment.appointmentStatus, // You may choose to send only the updated status array
    };

    res.status(200).json({
      success: true,
      message: "Appointment status updated successfully",
      data: responseData,
    });
  } catch (error) {
    // If an error occurs during the process, handle it and return a 500 error
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.put("/update-date/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    appointment.appointmentDate = req.body.date;
    appointment.timeSlot = req.body.timeSlot;

    await appointment.save();

    res.send(appointment);
  } catch (error) {
    // If an error occurs during the process, handle it and return a 500 error
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// add additional parts in appointment
router.put("/update-appointment/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    const validationErrors = [];
    const appointmentParts = [];

    for (const part of req.body.parts) {
      const product = await Product.findById(part.id).populate("brand");

      // console.log(product);

      if (!product) {
        validationErrors.push(`Product with ID ${part.id} not found.`);
        continue;
      }

      if (product.stock <= 0) {
        validationErrors.push(`${product.name} is out of stock!.`);
        continue;
      }

      if (product.stock < part.quantity) {
        validationErrors.push(`Not enough stock of product ${product.name}.`);
        continue;
      }

      // Log the stock change
      product.stock -= part.quantity;
      const stockChange = -part.quantity; // Negative quantity for a sold product

      // Update the stockLogs
      product.stockLogs.push({
        name: product.name,
        brand: product.brand.name,
        quantity: stockChange,
        status: "Sold",
        // by: `${user.firstname} - ${user.role}`,
        by: "test",
      });

      if (product) {
        product.stock -= part.quantity;
        await product.save();
      }

      appointmentParts.push({
        _id: product._id,
        productName: product.name,
        brandName: product.brand.name,
        quantity: part.quantity,
        price: product.price,
      });
    }

    // Check if there were validation errors
    if (validationErrors.length > 0) {
      console.log(validationErrors);
      return res.status(400).send(validationErrors.join("\n"));
    }

    // Update appointment with new parts and status
    const updateAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        parts: appointmentParts,
        totalPartPrice: req.body.partsPrice,
        // $push: {
        //   appointmentStatus: {
        //     status: "COMPLETED",
        //     message: "Appointment has been updated",
        //     timestamp: new Date(),
        //   },
        // },
      },
      { new: true }
    );

    console.log(updateAppointment, "updateAppointment");

    if (!updateAppointment) {
      return res
        .status(400)
        .json({ success: false, message: "Failed to update appointment." });
    }

    // res.status(200).json({
    //   success: true,
    //   message: "Appointment updated successfully.",
    //   appointment: updateAppointment,
    // });

    res.send(updateAppointment);
  } catch (error) {
    console.error(error, "errors");
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// mechanic upload inspection report
router.put(
  "/mechanic-update/:id",
  uploadOptions.single("image"),
  async (req, res) => {
    try {
      // Find the appointment by its ID in the database
      const appointment = await Appointment.findById(req.params.id);

      // Check if the appointment exists
      if (!appointment) {
        // If not found, return a 404 error
        return res
          .status(404)
          .json({ success: false, message: "Appointment not found" });
      }

      const file = req.file;

      let image = {
        public_id: null,
        url: null,
      }; // Ensure image is an object

      if (file) {
        const result = await cloudinary.v2.uploader.upload(file.path, {
          folder: "inspection report",
        });

        image = {
          public_id: result.public_id,
          url: result.secure_url,
        };
      }

      console.log("appoint", appointment);

      // Extract the status details from the request body
      // const { status } = req.body;

      // let message = "";

      // if (status === "DONE") {
      //   message = "Mechanic has completed servicing. Final checks in progress.";
      // }

      // // Create a new status object
      // const newStatus = {
      //   status,
      //   message,
      //   timestamp: new Date(), // Timestamp of the update
      // };

      // // Push the new status object into the appointmentStatus array
      // appointment.appointmentStatus.push(newStatus);

      // Save the updated appointment to the database
      // await appointment.save();

      const updateAppointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        {
          mechanicProof: image,
        },
        { new: true }
      );

      console.log(updateAppointment);

      // // Extract only the necessary information to send in the response
      // const responseData = {
      //   _id: appointment._id,
      //   appointmentStatus: appointment.appointmentStatus, // You may choose to send only the updated status array
      // };

      // // If successful, send a success response with the extracted data
      // res.status(200).json({
      //   success: true,
      //   message: "Appointment status updated successfully",
      //   data: responseData,
      // });

      if (!updateAppointment) {
        res.status(400).json({ message: "The brand cannot be updated!" });
      } else {
        res.send(updateAppointment);
      }
    } catch (error) {
      // If an error occurs during the process, handle it and return a 500 error
      console.error(error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  }
);

// customer upload inspection report
router.put(
  "/customer-update/:id",
  uploadOptions.single("image"),
  async (req, res) => {
    try {
      // Find the appointment by its ID in the database
      const appointment = await Appointment.findById(req.params.id);

      // Check if the appointment exists
      if (!appointment) {
        // If not found, return a 404 error
        return res
          .status(404)
          .json({ success: false, message: "Appointment not found" });
      }

      const file = req.file;

      let image = {
        public_id: null,
        url: null,
      }; // Ensure image is an object

      if (file) {
        const result = await cloudinary.v2.uploader.upload(file.path, {
          folder: "inspection report",
        });

        image = {
          public_id: result.public_id,
          url: result.secure_url,
        };
      }

      console.log("appoint", appointment);

      const updateAppointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        {
          customerProof: image,
        },
        { new: true }
      );

      if (!updateAppointment) {
        res.status(400).json({ message: "The appointment cannot be updated!" });
      } else {
        res.send(updateAppointment);
      }
    } catch (error) {
      // If an error occurs during the process, handle it and return a 500 error
      console.error(error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  }
);

//assign mechanic for task
// Update or assign mechanic for an appointment
router.put("/assign-mechanic/:id", async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const mechanicId = req.body.mechanicId; // Assuming the request body contains the mechanicId to be assigned

    // Fetch the appointment by ID
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    // Check if the selected mechanic exists
    const mechanic = await User.findById(mechanicId);

    if (!mechanic || mechanic.role !== "mechanic") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or non-existent mechanic" });
    }

    // Assign the mechanic to the appointment
    appointment.mechanic = mechanicId;
    await appointment.save();

    return res.status(200).json({
      success: true,
      message: "Mechanic assigned successfully",
      appointment,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

//get all appointments for a mechanic
router.get("/mechanic/:mechanicId", async (req, res) => {
  try {
    const mechanicId = req.params.mechanicId;

    console.log(mechanicId);

    const appointments = await Appointment.find({ mechanic: mechanicId })
      .populate({
        path: "user",
      })
      .populate({
        path: "appointmentServices",
        populate: { path: "service", model: "Service" },
      })
      .sort({ appointmentDate: 1 }) // Sorting by appointmentDate ascending
      .lean();

    if (!appointments) {
      return res
        .status(404)
        .json({ success: false, message: "No appointments found" });
    }

    console.log(appointments);

    res.send(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

//get upcoming appointments for a mechanic
router.get("/mechanic/:mechanicId/upcoming", async (req, res) => {
  try {
    const mechanicId = req.params.mechanicId;

    console.log(mechanicId, "asd");

    const currentDate = new Date();

    console.log(currentDate);
    // currentDate.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0 to represent the start of the day

    const appointments = await Appointment.find({
      mechanic: mechanicId,
      appointmentDate: { $gt: currentDate }, // Use $gt (greater than) instead of $gte if you want to exclude the current date
    })
      .populate({
        path: "user",
      })
      .populate({
        path: "appointmentServices",
        populate: { path: "service", model: "Service" },
      })
      .sort({ appointmentDate: 1 }) // Sorting by appointmentDate ascending
      .lean();

    // if (!appointments || appointments.length === 0) {
    //   // Check if no appointments found
    //   return res
    //     .status(404)
    //     .json({ success: false, message: "No upcoming appointments found" });
    // }

    console.log(appointments);

    res.send(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

//get today's appointments for a mechanic
router.get("/mechanic/:mechanicId/today", async (req, res) => {
  try {
    const mechanicId = req.params.mechanicId;

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0 to represent the start of the day

    const appointments = await Appointment.find({
      mechanic: mechanicId,
      appointmentDate: {
        $gte: today, // Greater than or equal to the start of today
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Less than the start of tomorrow
      },
    })
      .populate({
        path: "user",
      })
      .populate({
        path: "appointmentServices",
        populate: { path: "service", model: "Service" },
      })
      .sort({ appointmentDate: 1 }) // Sorting by appointmentDate ascending
      .lean();

    if (!appointments || appointments.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No appointments for today found" });
    }

    res.send(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

//get completed appointments for a mechanic
router.get("/mechanic/:mechanicId/completed", async (req, res) => {
  try {
    const mechanicId = req.params.mechanicId;

    console.log(mechanicId);

    const appointments = await Appointment.find({
      mechanic: mechanicId,
      "appointmentStatus.status": "COMPLETED",
    })
      .populate({
        path: "user",
      })
      .populate({
        path: "appointmentServices",
        populate: { path: "service", model: "Service" },
      })
      .sort({ appointmentDate: -1 }) // Sorting by appointmentDate descending
      .lean();

    if (!appointments) {
      return res
        .status(404)
        .json({ success: false, message: "No completed appointments found" });
    }

    res.send(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

//create mechanic feedback by customer
router.put("/feedback/:id", async (req, res) => {
  try {
    const { comment, rating } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Check if the user has already reviewed the mechanic
    let existingFeedback = await Feedback.findOne({
      appointment: req.params.id,
    });

    if (existingFeedback) {
      // If feedback already exists, update it
      existingFeedback.comment = comment;
      existingFeedback.rating = rating;
      await existingFeedback.save();
      return res.status(200).json(existingFeedback); // Return the updated feedback
    }

    // Create new feedback
    const feedback = new Feedback({
      appointment: req.params.id,
      mechanic: appointment.mechanic,
      customer: appointment.user,
      name: req.body.username,
      rating,
      comment,
    });

    await feedback.save();

    // res.status(201).json(feedback); // Return the created feedback
    res.send(feedback);
  } catch (error) {
    console.error("Error creating or updating feedback:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
