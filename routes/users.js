const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("cloudinary");
const { Token } = require("../models/token");
const sendtoEmail = require("../utils/sentToEmail");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { log } = require("console");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "reignelegend18@gmail.com",
    pass: "arxzlvahlfuzmbvk",
  },
});

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

const sendEmail = async (email, name, verificationLink) => {
  try {
    // Send email
    await transporter.sendMail({
      from: "reignelegend18@gmail.com",
      // to: `${email}`,
      to: `${email}`,
      subject: `TeamPOOR - Email Verification`,
      html: `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
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
              .button {
                  display: inline-block;
                  background-color: #007bff;
                  color: #fff;
                  padding: 10px 20px;
                  text-decoration: none;
                  border-radius: 10px;
                  font-size: 16px;
                  cursor: pointer;
              }
              .button:hover {
                  background-color: #0056b3;
              }
          </style>
      </head>
      <body>
      <header>
          <h2>Email Verification</h2>
      </header>
      <main>
          <p>Dear ${name},</p>
          <p>Thank you for signing up with TeamPOOR - Motorcycle Parts & Services. To complete your registration, please click the button below to verify your email address:</p>
          <p style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email</a>
          </p>
          <p>If you did not request this, you can safely ignore this email.</p>
          <p>Please note: Your security is important to us. We will never ask you to share your password or other sensitive information via email.</p>
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

router.get(`/`, async (req, res) => {
  // const userList = await User.find();
  const userList = await User.find().select("-password");
  console.log(userList);

  if (!userList) {
    res.status(500).json({ success: false });
  }
  res.send(userList);
});

//fetch users with role 'user'
router.get("/all-users", async (req, res) => {
  const userList = await User.find({ role: "user" }).select("-password");

  // console.log(userList);
  if (!userList) {
    res.status(500).json({ success: false });
  }

  res.send(userList);
});

// Fetch users with the roles 'employee' and 'admin'
router.get("/all-employee", async (req, res) => {
  try {
    const userList = await User.find({
      role: { $in: ["secretary", "mechanic", "admin"] },
    }).select("-password");

    if (!userList) {
      return res.status(500).json({ success: false });
    }

    res.send(userList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
});

// Fetch users with the roles 'employee' and 'admin'
router.get("/all-mechanics", async (req, res) => {
  try {
    const userList = await User.find({
      role: { $in: ["mechanic"] },
    }).select("-password");

    if (!userList) {
      return res.status(500).json({ success: false });
    }

    res.send(userList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
});
// Fetch users role supplier
router.get("/suppliers", async (req, res) => {
  try {
    const userList = await User.find({
      role: "supplier",
    }).select("-password");

    if (!userList) {
      return res.status(500).json({ success: false });
    }

    console.log(userList);

    res.send(userList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
});

// find user
router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  console.log("user", user);

  if (!user) {
    res
      .status(500)
      .json({ message: "The user with the given ID was not found." });
  }

  res.status(200).send(user);
});

// create user
router.post(`/`, async (req, res) => {
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);

  let password = await bcrypt.hashSync(req.body.password, salt);

  // const file = req.file;
  // if (!file) return res.status(400).send('No image in the request');

  // const fileName = file.filename;
  // const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

  let user = new User({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    password: password,
    address: req.body.address,
    town: req.body.town,
    city: req.body.city,
    zipcode: req.body.zipcode,
    phone: req.body.phone,
    // image: `${basePath}${fileName}`,
    role: req.body.role,
  });

  user = await user.save();

  if (!user) return res.status(400).send("the user cannot be created");

  res.send(user);
});

// register or signup
router.post("/register", async (req, res) => {
  try {
    // Check if email already exists
    const existingEmail = await User.findOne({ email: req.body.email });
    if (existingEmail) {
      return res.status(400).send("Email already exists");
    }

    // Check if phone number already exists
    const existingPhone = await User.findOne({ phone: req.body.phone });
    if (existingPhone) {
      return res.status(400).send("Phone number already exists");
    }

    // If email and phone number are unique, proceed with user creation
    let user = new User({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      phone: req.body.phone,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      role: req.body.role,
    });

    user = await user.save();

    const token = await new Token({
      verifyUser: user._id,
      token: crypto.randomBytes(32).toString("hex"),
      verificationTokenExpire: new Date(Date.now() + 2 * 60 * 1000),
    }).save();

    if (!user) return res.status(400).send("The user cannot be created!");

    // const emailVerification = `${process.env.FRONTEND_URL}/verify/email/${token.token}/${user._id}`;
    const temporaryLink = `${process.env.WEB_URL}/verify/email/${token.token}/${user._id}`;

    sendEmail(user.email, user.firstname + user.lastname, temporaryLink);

    res.send(user);
  } catch (error) {
    // Handle any other errors that may occur during the process
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/verify-email/:token/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(400).send("Invalid link");
    }

    let token = await Token.findOne({ verifyUser: user._id });

    if (token) {
      token.token = req.params.token;
      await token.save();
    } else {
      token = new Token({
        verifyUser: user._id,
        token: req.params.token,
      });
      await token.save();
    }

    await User.findByIdAndUpdate(req.params.userId, { verified: true });

    res.status(200).json({ message: "Email verified successfully" });

    // res.send(user);
  } catch (error) {
    // Handle any other errors that may occur during the process
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// update profile by customer
router.put("/profile/:id", uploadOptions.single("image"), async (req, res) => {
  try {
    const userFind = await User.findById(req.params.id);

    // console.log(req.params);

    // // Check if email already exists for a user other than the one being updated
    // const existingEmail = await User.findOne({
    //   email: req.body.email,
    //   _id: { $ne: req.params.id },
    // });
    // if (existingEmail) {
    //   return res
    //     .status(400)
    //     .json({ success: false, message: "Email already exists" });
    // }

    // Check if phone number already exists for a user other than the one being updated
    const existingPhone = await User.findOne({
      phone: req.body.phone,
      _id: { $ne: req.params.id },
    });
    if (existingPhone) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number already exists" });
    }

    const file = req.file;

    let image = [];

    if (file) {
      const result = await cloudinary.v2.uploader.upload(file.path, {
        folder: "avatars",
      });

      image = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    } else {
      image = userFind.images;
    }

    const updatedUser = {
      firstname: req.body.firstname || userFind.firstname,
      lastname: req.body.lastname || userFind.lastname,
      gender: req.body.gender || userFind.gender,
      phone: req.body.phone || userFind.phone,
      region: req.body.region || userFind.region,
      province: req.body.province || userFind.province,
      city: req.body.city || userFind.city,
      barangay: req.body.barangay || userFind.barangay,
      postalcode: req.body.postalcode || userFind.postalcode,
      address: req.body.address || userFind.address,
      avatar: image,
    };

    console.log(updatedUser, "user");

    const user = await User.findByIdAndUpdate(req.params.id, updatedUser, {
      new: true,
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "The user cannot be updated" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//login with verification
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      // return res.status(404).send("User not found");
      return res.status(404).json({
        error: "Incorrect email or password",
      });
    }

    if (!bcrypt.compareSync(req.body.password, user.password)) {
      // return res.status(401).send("Invalid password");
      return res.status(401).json({
        error: "Incorrect email or password",
      });
    }

    const secret = process.env.secret;
    const authToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      secret,
      { expiresIn: "1d" }
    );

    if (!user.verified) {
      let verificationToken = await Token.findOne({ verifyUser: user._id });
      const currentTime = new Date();
      if (
        !verificationToken ||
        verificationToken.verificationTokenExpire < currentTime
      ) {
        verificationToken = await Token.findOneAndUpdate(
          {
            verifyUser: user._id,
          },
          {
            token: crypto.randomBytes(32).toString("hex"),
            verificationTokenExpire: new Date(
              currentTime.getTime() + 2 * 60 * 1000
            ), // Set expiry time 2 minutes from now
          },
          { new: true, upsert: true }
        );
        const temporaryLink = `${process.env.WEB_URL}/verify/email/${verificationToken.token}/${user._id}`;
        sendEmail(
          { email: user.email },
          { firstname: user.firstname, lastname: user.lastname },
          temporaryLink
        );

        console.log("Token expired! New one has been sent to your email.");
        return res.status(403).json({
          error: "Token expired! New one has been sent to your email.",
        });
      } else {
        console.log("Please check your email for the verification link.");
        return res.status(403).json({
          error: "Please check your email for the verification link.",
        });
      }
    } else {
      console.log("login success");

      return res.status(200).send({ user: user.email, token: authToken });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).send("Internal Server Error");
  }
});

//login with verification
router.post("/login-employee", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        error: "Incorrect email or password",
      });
    }

    if (!bcrypt.compareSync(req.body.password, user.password)) {
      return res.status(401).json({
        error: "Incorrect email or password",
      });
    }

    // Check if the user has one of the allowed roles
    if (
      user.role !== "mechanic" &&
      user.role !== "supplier" &&
      user.role !== "secretary" &&
      user.role !== "admin"
    ) {
      return res.status(403).json({
        error: "You do not have permission to access this resource",
      });
    }

    const secret = process.env.secret;
    const authToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      secret,
      { expiresIn: "1d" }
    );

    if (!user.verified) {
      let verificationToken = await Token.findOne({ verifyUser: user._id });
      const currentTime = new Date();
      if (
        !verificationToken ||
        verificationToken.verificationTokenExpire < currentTime
      ) {
        verificationToken = await Token.findOneAndUpdate(
          {
            verifyUser: user._id,
          },
          {
            token: crypto.randomBytes(32).toString("hex"),
            verificationTokenExpire: new Date(
              currentTime.getTime() + 2 * 60 * 1000
            ), // Set expiry time 2 minutes from now
          },
          { new: true, upsert: true }
        );

        const temporaryLink = `${process.env.WEB_URL}/verify/email/${verificationToken.token}/${user._id}`;

        sendEmail(
          { email: user.email },
          { firstname: user.firstname, lastname: user.lastname },
          temporaryLink
        );

        console.log("Token expired! New one has been sent to your email.");
        return res.status(403).json({
          error: "Token expired! New one has been sent to your email.",
        });
      } else {
        console.log("Please check your email for the verification link.");
        return res.status(403).json({
          error: "Please check your email for the verification link.",
        });
      }
    } else {
      console.log("login success");

      return res.status(200).send({ user: user.email, token: authToken });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).send("Internal Server Error");
  }
});

// //login
// router.post("/login", async (req, res) => {
//   const user = await User.findOne({ email: req.body.email });

//   const secret = process.env.secret;
//   if (!user) {
//     return res.status(400).send("The user not found");
//   }

//   if (user && bcrypt.compareSync(req.body.password, user.password)) {
//     const token = jwt.sign(
//       {
//         userId: user.id,
//         role: user.role,
//       },
//       secret,
//       { expiresIn: "1d" }
//     );

//     res.status(200).send({ user: user.email, token: token });
//   } else {
//     res.status(400).send("password is wrong!");
//   }
// });

//delete user
router.delete("/:id", (req, res) => {
  User.findByIdAndRemove(req.params.id)
    .then((user) => {
      if (user) {
        return res
          .status(200)
          .json({ success: true, message: "the user is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "user not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

// update role by admin
router.put("/update-role/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// change password
router.put("/change-password/:id", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if the current password provided is correct
    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }

    // Update the password
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const newHashedPassword = bcrypt.hashSync(newPassword, salt);

    user.password = newHashedPassword;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// create employee by admin
router.post("/employee/create", async (req, res) => {
  let user = new User({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10),
    role: req.body.role,
  });

  console.log(user);

  user = await user.save();

  if (!user) return res.status(400).send("the employee cannot be created!");

  res.send(user);
});

module.exports = router;
