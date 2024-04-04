const { Service } = require("../models/service");
const { ServiceCategory } = require("../models/serviceCategory");
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

// router.get(`/`, async (req, res) => {
//     let filter = {};

// })

router.get(`/`, async (req, res) => {
  // console.log(req.query, 'fetch services');

  // let filter = {};

  // if (req.query.categories) {
  //   filter.category = { $in: req.query.categories.split(",") };
  // }

  try {
    const services = await Service.find()

    console.log(services);

    if (!services || services.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No services found" });
    }

    res.status(200).json(services);
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

  let service = new Service({
    name: req.body.name,
    price: req.body.price,
    description: req.body.description,
    type: req.body.type,
    images: imagesLinks,
    isAvailable: req.body.isAvailable,
  });

  service = await service.save();

  if (!service) {
    return res.status(500).send("The service cannot be created");
  } else {
    res.send(service);
  }
});

//update service
router.put("/:id", uploadOptions.array("images"), async (req, res) => {
  console.log(req.body.category);
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send("Invalid Service ID");
  }

  // const category = await ServiceCategory.findById(req.body.category);

  // if (!category) {
  //   return res.status(400).send("Invalid Service!");
  // }

  const service = await Service.findById(req.params.id);

  if (!service) {
    return res.status(400).send("Invalid Service!");
  }

  const files = req.files;

  let imagesLinks = [];

  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  if (req.body.isNewImage === "true") {
    for (let i = 0; i < files.length; i++) {
      const result = await cloudinary.v2.uploader.upload(files[i].path, {
        folder: "services",
      });

      imagesLinks.push({
        public_id: result.public_id,

        url: result.secure_url,
      });
    }
  } else if (req.body.isNewImage === "false") {
    imagesLinks = service.images;
  }

  const updateService = await Service.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      // category: req.body.category,
      type: req.body.type,
      images: imagesLinks,
      isAvailable: req.body.isAvailable,
    },
    { new: true }
  );


  if (!updateService) {
    return res.status(500).send("The service cannot be updated!");
  } else {
    res.send(updateService);
  }
});

//delete service
router.delete("/:id", (req, res) => {
  Service.findByIdAndRemove(req.params.id)
    .then((service) => {
      if (service) {
        return res
          .status(200)
          .json({ success: true, message: "The service is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Service not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

module.exports = router;
