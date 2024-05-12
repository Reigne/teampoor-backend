const { Brand } = require("../models/brand");
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

//fetch all brand
router.get(`/`, async (req, res) => {
  const brandList = await Brand.find();

  if (!brandList) {
    res.status(500).json({ success: false });
  } else {
    res.status(200).send(brandList);
  }
});

//fetch brand by id
router.get("/:id", async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    res
      .status(500)
      .json({ message: "The brand with the given id was not found" });
  } else {
    res.status(200).send(brand);
  }
});

router.post("/", uploadOptions.single("image"), async (req, res) => {
  try {
    const file = req.file;

    let image = {
      public_id: null,
      url: null,
    }; // Ensure image is an object

    if (file) {
      const result = await cloudinary.v2.uploader.upload(file.path, {
        folder: "brands",
      });

      image = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    let brand = new Brand({
      name: req.body.name,
      images: image,
    });

    console.log(brand);

    brand = await brand.save();

    if (!brand) {
      res.status(400).json({ message: "The brand cannot be created!" });
    } else {
      res.send(brand);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put("/:id", uploadOptions.single("image"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send("Invalid Brand ID");
    }

    const file = req.file;
    const findBrand = await Brand.findById(req.params.id);

    if (!findBrand) {
      return res.status(400).send("Invalid Brand");
    }

    let image = [];

    if (file) {
      const result = await cloudinary.v2.uploader.upload(file.path, {
        folder: "brands",
      });

      image = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    } else {
      image = findBrand.image;
    }

    const updateBrand = await Brand.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        images: image,
      },
      { new: true }
    );

    // console.log(updateBrand, "abc")

    if (!updateBrand) {
      res.status(400).json({ message: "The brand cannot be updated!" });
    } else {
      res.send(updateBrand);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

//delete brand
router.delete("/:id", (req, res) => {
  Brand.findByIdAndRemove(req.params.id)
    .then((brand) => {
      if (brand) {
        return res
          .status(200)
          .json({ success: true, message: "Brand is deleted" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Brand not found" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

module.exports = router;
