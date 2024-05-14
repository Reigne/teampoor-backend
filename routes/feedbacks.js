const { Appointment } = require("../models/appointment");
const { Feedback } = require("../models/feedback");
const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate("customer")
      .populate("mechanic")
      .populate({
        path: "appointment",
        populate: [
          {
            path: "appointmentServices",
            model: "AppointmentServices",  // Ensure this matches the schema
            populate: {
              path: "service",
              model: "Service",
            },
          },
          {
            path: "additionalService",  // Correct path name
            model: "AppointmentServices",  // Ensure this matches the schema
            populate: {
              path: "service",
              model: "Service",
            },
          },
        ],
      })
      .sort({ dateOrdered: -1 });

    console.log(feedbacks, "feedbacks");

    res.send(feedbacks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;
