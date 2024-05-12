const { Category } = require("../models/category");
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
  const categoryList = await Category.find();

  if (!categoryList) {
    res.status(500).json({ success: false });
  } else {
    res.status(200).send(categoryList);
  }
});

router.get("/:id", async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res
      .status(500)
      .json({ message: "The category with the given I.D was not found!" });
  } else {
    res.status(200).send(category);
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
      folder: "categories",
    });

    image = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }

  let category = new Category({
    name: req.body.name,
    images: image,
  });

  category = await category.save();

  if (!category) {
    return res.status(400).send("The category cannot be created!");
  } else {
    return res.status(200).send(category);
  }
});

router.put("/:id", uploadOptions.single("image"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send("Invalid Product ID");
  }

  const findCategory = await Category.findById(req.params.id);

  if (!findCategory) {
    return res.status(400).send("Invalid Category");
  }

  const file = req.file;

  let image = [];

  if (file) {
    const result = await cloudinary.v2.uploader.upload(file.path, {
      folder: "categories",
    });

    image = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  } else {
    image = findCategory.images;
  }

  const category = await Category.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      images: image,
    },
    { new: true }
  );

  if (!category) {
    return res.status(400).send("The category cannot be updated");
  } else {
    res.send(category);
  }
});

router.delete("/:id", (req, res) => {
  Category.findByIdAndRemove(req.params.id)
    .then((category) => {
      if (category) {
        return res
          .status(400)
          .json({ success: true, message: "The category is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "The category not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, message: err });
    });
});

module.exports = router;
