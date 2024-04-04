const { Fuel } = require("../models/fuel");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("cloudinary");
const nodemailer = require("nodemailer");
const { Notification } = require("../models/notification");

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

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "reignelegend18@gmail.com",
    pass: "arxzlvahlfuzmbvk",
  },
});

const sendEmail = async (item) => {
  try {
    // Send email
    await transporter.sendMail({
      from: "reignelegend18@gmail.com",
      to: "reignelegend18@gmail.com",
      subject: "PMS Reminder for Your Motorcycle",
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PMS Reminder</title>
          <style>
              /* Define your styles here */
              body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  padding: 5% 10%; /* 5% top/bottom padding, 10% left/right padding */
                  background-color: #f4f4f4;
              }
              header {
                  text-align: center;
                  margin-bottom: 20px;
                  padding: 1%;
                  background-size: cover;
                  background-position: center;
                  border-radius: 10px;
                  color: #fff; /* Set header text color to white */
                  background-color: #ef4444; /* Add background color to header */
              }
              
              main {
                  text-align: left;
                  margin-bottom: 20px;
                  background-color: #fff;
                  padding: 5% 10%; /* 5% top/bottom padding, 10% left/right padding */
                  border-radius: 10px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              footer {
                  margin-top: 20px;
                  text-align: center;
                  font-size: 0.8em;
              }
              .pms-details {
                  margin-bottom: 20px;
              }
          </style>
      </head>
      <body>
      <header>
      <h2>PMS Reminder for Your Motorcycle</h2>     
      </header>
      <main>
          <p>Dear Customer,</p>
          <p>This is a friendly reminder to schedule Preventive Maintenance Service (PMS) for your motorcycle.</p>
          <div class="pms-details">
              <p><strong>Motorcycle:</strong> ${item.motorcycle.brand} (${item.motorcycle.plateNumber})</p>
          </div>
          <p>Please ensure timely servicing to maintain the performance and longevity of your vehicle.</p>
          <p>For any inquiries or to schedule an appointment, please contact our service center.</p>
          <p>Thank you for choosing our services!</p>
      </main>
      <footer>
          <p>This email was sent automatically. Please do not reply.</p>
      </footer>
      </body>
      </html>
    `,
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

router.post("/create", uploadOptions.array("images"), async (req, res) => {
  try {
    console.log(req.body);
    // console.log(new Date(req.body.date));

    const {
      motorcycle,
      odometer,
      quantity,
      price,
      totalCost,
      fillingStation,
      notes,
      date,
      userId,
    } = req.body;

    if (
      !odometer ||
      !motorcycle ||
      !quantity ||
      !price ||
      !totalCost ||
      !fillingStation ||
      !date ||
      !userId
    ) {
      return res.status(400).send("All fields are required.");
    }

    let fuel = new Fuel({
      user: userId, // Assuming you have a user associated with the fuel creation
      motorcycle: motorcycle,
      odometer: odometer,
      quantity: quantity,
      price: price,
      totalCost: totalCost,
      fillingStation: fillingStation,
      notes: notes || "",
      date: date,
    });

    console.log(fuel);

    fuel = await fuel.save();

    // Check if the condition is met to send the email
    const fuels = await Fuel.find({ motorcycle: motorcycle })
      .sort({ date: -1 })
      .limit(2)
      .populate("motorcycle")
      .exec();

    if (fuels.length === 2) {
      const item = fuels[0];
      const latestOdometer = fuels[0].odometer;
      const secondLatestOdometer = fuels[1].odometer;
      const difference = latestOdometer - secondLatestOdometer;
      if (difference >= 1000) {
        sendEmail(item);

        let notification = new Notification({
          user: userId,
          title: "PMS Reminder",
          // message: `Your motorcycle has reached 1500 kilometers on the odometer. It's time to schedule Preventive Maintenance Service (PMS).`,
          message: `Time for PMS! Your motorcycle ${item.motorcycle.brand} (${item.motorcycle.plateNumber}) hit 1000 km.`,
        });

        notification = await notification.save();

        console.log("item:", item);
        console.log("difference:", difference);
      } else {
        console.log("Email not sent Difference:", difference);
      }
    }

    return res.status(200).send(fuel);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});

//update fuel
router.post(
  "/update/:fuelId",
  uploadOptions.array("images"),
  async (req, res) => {
    try {
      const fuelId = req.params.fuelId;

      console.log(fuelId, "fuel id");

      console.log(req.body, "body");

      const fuel = await Fuel.findById(fuelId);

      if (!fuel) {
        return res.status(400).send("Invalid Fuel!");
      }

      const {
        odometer,
        quantity,
        price,
        totalCost,
        fillingStation,
        notes,
        date,
        userId,
      } = req.body;

      if (
        !odometer ||
        !quantity ||
        !price ||
        !totalCost ||
        !fillingStation ||
        !date ||
        !userId
      ) {
        return res.status(400).send("All fields are required.");
      }

      const updatedFuel = await Fuel.findByIdAndUpdate(
        fuelId,
        {
          user: userId,
          odometer: odometer,
          quantity: quantity,
          price: price,
          totalCost: totalCost,
          fillingStation: fillingStation,
          notes: notes || "",
          date: date,
        },
        { new: true } // This option returns the modified document
      );

      console.log(fuel, "fuel find");

      if (!updatedFuel) {
        return res.status(404).send("Fuel record not found.");
      }

      return res.status(200).send(updatedFuel);
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }
  }
);

//delete fuel
router.delete("/delete/:id", (req, res) => {
  Fuel.findByIdAndRemove(req.params.id)
    .then((fuel) => {
      if (fuel) {
        return res
          .status(200)
          .json({ success: true, message: "The fuel is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Fueld not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

router.get("/totalCostLast30Days", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Fuel.aggregate([
      {
        $match: {
          date: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalCost: { $sum: { $toDouble: "$totalCost" } },
        },
      },
    ]);

    const totalCost = result.length > 0 ? result[0].totalCost : 0;
    console.log(totalCost);
    return res.status(200).json({ totalCost });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});

router.get("/all/:userId", async (req, res) => {
  try {
    const userId = req.params.userId; // Extract user ID from the URL parameter

    const fuels = await Fuel.find({ user: userId }).sort({ Date: -1 }).lean();

    res.send(fuels);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//get all the name of station by user input
router.get("/station/:userId", async (req, res) => {
  try {
    const userId = req.params.userId; // Extract user ID from the URL parameter

    const fuels = await Fuel.find({ user: userId })
      .select("fillingStation")
      .sort({ date: -1 })
      .lean();

    console.log(fuels);
    res.send(fuels);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
