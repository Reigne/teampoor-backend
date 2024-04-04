const { Appointment } = require("../models/appointment");
const { AppointmentService } = require("../models/appointment-service");
const { Service } = require("../models/service");
const { User } = require("../models/user");
const cloudinary = require("cloudinary");
const { Product } = require("../models/product");
const { Feedback } = require("../models/feedback");

const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const multer = require("multer");
const mongoose = require("mongoose");

router.get("/", async (req, res) => {
  try {
    // Fetch all feedbacks from the database
    const feedbacks = await Feedback.find()
      .populate({
        path: "customer",
      })
      .populate({
        path: "mechanic",
      })
      .populate({
        path: "appointment",
        populate: [
          {
            path: "appointmentService",
            model: "AppointmentService",
            populate: {
              path: "service",
              model: "Service",
            },
          },
          {
            path: "additionalService",
            model: "AppointmentService",
            populate: {
              path: "service",
              model: "Service",
            },
          },
        ],
      })
      .sort({ dateOrdered: -1 });

    console.log(feedbacks, "feedbacks");

    // res.status(200).json({ success: true, feedbacks });
    res.send(feedbacks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;
