const { Motorcycle } = require("../models/motorcycle");
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

//get list of motorcycle by customer
router.get("/my-motorcycles/:id", async (req, res) => {
  try {
    console.log(req.params.id, "user id");
    const userId = req.params.id;

    // Check if the user exists
    const user = await User.findById(userId);

    // console.log(user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find orders by the user's ID
    const motorcycles = await Motorcycle.find({ owner: userId }).lean();

    console.log(motorcycles);

    res.send(motorcycles);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//get for motorcycle dropdown in services
router.get("/dropdown/:id", async (req, res) => {
  try {
    console.log(req.params.id, "user id");
    const userId = req.params.id;

    // Check if the user exists
    const user = await User.findById(userId);

    // console.log(user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find orders by the user's ID
    const motorcycles = await Motorcycle.find({ owner: userId }).lean();

    console.log(motorcycles);

    res.send(motorcycles);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//create motorcycle by customer
router.post(`/create-motorcycle/:id`, uploadOptions.any(), async (req, res) => {
  // console.log(req.params.id);
  try {
    console.log(req.files, "files");

    const existingPlateNumber = await Motorcycle.findOne({
      plateNumber: req.body.plateNumber,
    });

    if (existingPlateNumber) {
      return res.status(400).json({ message: "Plate number already exists!" });
    }

    console.log(existingPlateNumber, "existingPlateNumber1111");

    const imgMotorcycleFiles = req.files.filter(
      (file) => file.fieldname === "imageMotorcycle"
    );

    const imgPlateNumberFiles = req.files.filter(
      (file) => file.fieldname === "imagePlateNumber"
    );

    let imageMotorcycle = [];

    for (let i = 0; i < imgMotorcycleFiles.length; i++) {
      const result = await cloudinary.v2.uploader.upload(
        imgMotorcycleFiles[i].path,
        {
          folder: "motorcycle",
        }
      );

      imageMotorcycle.push({
        public_id: result.public_id,

        url: result.secure_url,
      });
    }

    let imagePlateNumber = [];

    // const result = await cloudinary.v2.uploader.upload(
    //   imgPlateNumberFiles.path,
    //   {
    //     folder: "plate number",
    //   }
    // );

    const result = await cloudinary.v2.uploader.upload(
      imgPlateNumberFiles[0].path,
      {
        folder: "plate number",
      }
    );

    imagePlateNumber = {
      public_id: result.public_id,

      url: result.secure_url,
    };

    console.log(imageMotorcycle, "imgMotorcycle");
    console.log(imagePlateNumber, "imagePlateNumber");

    // console.log(existingPlateNumber, "existingPlateNumber2");

    const motorcycle = await Motorcycle.create({
      // model: req.body.model,
      year: req.body.year,
      brand: req.body.brand,
      plateNumber: req.body.plateNumber,
      engineNumber: req.body.engineNumber,
      type: req.body.type,
      fuel: req.body.fuel,
      owner: req.params.id,
      imageMotorcycle: imageMotorcycle || "",
      imagePlateNumber: imagePlateNumber,
    });

    console.log(motorcycle, "motorcycle form");

    //   if (!updateBrand) {
    //     res.status(400).json({ message: "The brand cannot be updated!" });
    //   } else {
    //     res.send(updateBrand);
    //   }
    // } catch (error) {
    //   console.error(error);
    //   res.status(500).json({ success: false, error: error.message });
    // }

    if (!motorcycle) {
      res.status(400).json({ message: "The motorcycle cannot be updated!" });
    } else {
      res.send(motorcycle);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post(`/`, uploadOptions.array("images"), async (req, res) => {
  const files = req.files;

  let images = [];

  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  let imagesLinks = [];

  for (let i = 0; i < files.length; i++) {
    const result = await cloudinary.v2.uploader.upload(files[i].path, {
      folder: "services",
    });

    imagesLinks.push({
      public_id: result.public_id,

      url: result.secure_url,
    });
  }

  const motorcycle = await Motorcycle.create({
    name: req.body.name,
    price: req.body.price,
    description: req.body.description,
    category: req.body.category,
    images: imagesLinks,
    availability: req.body.availability,
  });

  service = await service.save();

  if (!motorcycle) {
    return res.status(500).send("The motorcycle cannot be created");
  } else {
    res.send(motorcycle);
  }
});

module.exports = router;
