const { Address } = require("../models/address");
const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("cloudinary");

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

const uploadOptions = multer({ storage });

//get list of address by customer
router.get("/:id", async (req, res) => {
  try {
    // console.log(req.params.id, "user id");
    const userId = req.params.id;

    // Check if the user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // console.log(user, 'user ifnd')

    // Find addresses by the user's ID
    const addresses = await Address.find({ user: userId }).lean();

    console.log(addresses);

    res.send(addresses);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//get list of address by customer
router.get("/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find addresses by the user's ID and sort them
    const addresses = await Address.find({ user: userId }).sort({ isDefault: -1 }).lean();
    // This will sort addresses in descending order of isDefault, so true values come first

    res.send(addresses);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});


router.post("/create", uploadOptions.array("images"), async (req, res) => {
  try {
    console.log(req.body);
    // console.log(req.params);

    const userFind = await User.findById(req.body.userId);

    if (!userFind) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(userFind);

    const createAddress = await Address.create({
      user: userFind.id || "",
      region: req.body.region || "",
      province: req.body.province || "",
      city: req.body.city || "",
      barangay: req.body.barangay || "",
      postalcode: req.body.postalcode || "",
      address: req.body.address || "",
    });

    if (!createAddress) {
      res.status(400).json({ message: "The address cannot be created!" });
    } else {
      res.send(createAddress);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});

router.put("/update/:id", uploadOptions.array("images"), async (req, res) => {
  try {
    console.log(req.params);
    // console.log(req.params);

    const userFind = await User.findById(req.body.userId);

    if (!userFind) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(userFind);

    const updatedAddress = await Address.findByIdAndUpdate(
      req.params.id,
      {
        user: userFind.id || "",
        region: req.body.region || "",
        province: req.body.province || "",
        city: req.body.city || "",
        barangay: req.body.barangay || "",
        postalcode: req.body.postalcode || "",
        address: req.body.address || "",
      },
      { new: true }
    ); // Add { new: true } to return the updated document

    if (!updatedAddress) {
      res.status(400).json({ message: "The address cannot be created!" });
    } else {
      res.send(updatedAddress);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});

router.delete("/delete/:id", (req, res) => {
  Address.findByIdAndRemove(req.params.id)
    .then((address) => {
      if (address) {
        return res
          .status(200)
          .json({ success: true, message: "Address is deleted" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Address not found" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

router.put(
  "/default/:id",
  uploadOptions.array("images"),
  async (req, res) => {
    try {

      console.log(req.body)
      const userFind = await User.findById(req.body.userId);

      if (!userFind) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log(userFind);

      // Unset default flag for all other addresses of the user
      await Address.updateMany({ user: req.body.userId }, { isDefault: false });

      // Set the new default address
      const address = await Address.findByIdAndUpdate(
        req.params.id,
        { isDefault: true },
        { new: true }
      );

      if (!address) {
        res.status(400).json({ message: "The address cannot be updated!" });
      } else {
        res.send(address);
      }
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }
  }
);

module.exports = router;
