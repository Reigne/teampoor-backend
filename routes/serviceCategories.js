const { ServiceCategory } = require("../models/serviceCategory");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const mongoose = require("mongoose");
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

const uploadOptions = multer({ storage: storage });

router.get(`/`, async (req, res) => {
  const serviceCategoriesList = await ServiceCategory.find();
console.log(serviceCategoriesList);

  if (!serviceCategoriesList) {
    res.status(500).json({ success: false });
  } else {
    res.status(200).send(serviceCategoriesList);
  }
});

router.post("/", uploadOptions.single("image"), async (req, res) => {
  const file = req.file;

  console.log(file);

  let image = {
    public_id: null,
    url: null,
  }; // Ensure image is an object

  if (req.file) {
    const result = await cloudinary.v2.uploader.upload(file.path, {
      folder: "service categories",
    });

    image = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }

  let serviceCategory = new ServiceCategory({
    name: req.body.name,
    image: image,
  });

  serviceCategory = await serviceCategory.save();

  if (!serviceCategory) {
    return res.status(400).send("The service category cannot be created!");
  } else {
    return res.status(200).send(serviceCategory);
  }
});

//update service category
router.put("/:id", uploadOptions.single("image"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send("Invalid Service Category ID");
    }

    const file = req.file;
    const findServiceCategory = await ServiceCategory.findById(req.params.id);

    if (!findServiceCategory) {
      return res.status(400).send("Invalid Service Category");
    }

    let image = [];

    if (file) {
      const result = await cloudinary.v2.uploader.upload(file.path, {
        folder: "service categories",
      });

      image = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    } else {
      image = findServiceCategory.image;
    }

    const updateServiceCategories = await ServiceCategory.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        image: image,
      },
      { new: true }
    );

    // console.log(updateBrand, "abc")

    if (!updateServiceCategories) {
      res.status(400).json({ message: "The service categories cannot be updated!" });
    } else {
      res.send(updateServiceCategories);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

//delete service category
router.delete("/:id", (req, res) => {
  ServiceCategory.findByIdAndRemove(req.params.id)
    .then((ServiceCategory) => {
      if (ServiceCategory) {
        return res
          .status(200)
          .json({ success: true, message: "Service Category is deleted" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Service Category not found" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

module.exports = router;
