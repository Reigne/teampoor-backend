const { Product } = require("../models/product");
const { User } = require("../models/user");
const { Category } = require("../models/category");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("cloudinary");
const { PriceHistory } = require("../models/priceHistory");

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

router.get(`/`, async (req, res) => {
  console.log(req.query);

  let filter = {};

  if (req.query.categories) {
    filter.category = { $in: req.query.categories.split(",") };
  }

  if (req.query.brands) {
    filter.brand = { $in: req.query.brands.split(",") };
  }

  try {
    const productList = await Product.find(filter)
      .populate("category")
      .populate("brand");

    console.log(productList);

    if (!productList || productList.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No products found" });
    }

    res.status(200).json(productList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

//create product
router.post(`/`, uploadOptions.array("images"), async (req, res) => {
  try {
    const files = req.files;

    console.log(files, "files");

    const category = await Category.findById(req.body.category);

    if (!category) {
      return res.status(400).send("Invalid Category!");
    }

    const user = await User.findById(req.body.user);

    if (!user) {
      return res.status(400).send("Invalid User!");
    }

    let images = [];

    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }

    let imagesLinks = [];

    for (let i = 0; i < files.length; i++) {
      const result = await cloudinary.v2.uploader.upload(files[i].path, {
        folder: "products",
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    console.log(imagesLinks, "image links");

    let product = new Product({
      name: req.body.name,
      price: req.body.price,
      brand: req.body.brand,
      description: req.body.description,
      type: req.body.type,
      category: req.body.category,
      stock: req.body.stock,
      images: imagesLinks,
      isWarranty: req.body.isWarranty,
    });

    product = await product.save();

    // Find the product first
    const foundProduct = await Product.findById(product._id).populate("brand");

    // Update stock and push stockLogs
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: foundProduct.id },
      {
        $push: {
          stockLogs: {
            name: foundProduct.name,
            brand: foundProduct.brand.name,
            quantity: req.body.stock,
            status: "Initial",
            by: `${user.firstname} - ${user.role}`, // Assuming user info is available
          },
        },
      },
      { new: true } // Return the updated document
    );

    const priceHistory = new PriceHistory({
      product: foundProduct.id, // Set the product reference
      price: foundProduct.price, // Set the price from the product
      status: "Initial", // Set the initial status
    });

    // Save the PriceHistory document
    await priceHistory.save();

    if (!updatedProduct) {
      return res.status(500).send("The product cannot be created");
    } else {
      res.send(updatedProduct);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
//update product
router.put("/:id", uploadOptions.array("images"), async (req, res) => {
  console.log(req.body.category);
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send("Invalid Product ID");
  }

  const category = await Category.findById(req.body.category);

  if (!category) {
    return res.status(400).send("Invalid Category!");
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(400).send("Invalid Product!");
  }

  const files = req.files;

  // console.log(files, "files");

  let imagesLinks = [];

  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  // console.log(req.body.isNewImage, "isNewImage");

  if (req.body.isNewImage === "true") {
    for (let i = 0; i < files.length; i++) {
      const result = await cloudinary.v2.uploader.upload(files[i].path, {
        folder: "products",
      });

      imagesLinks.push({
        public_id: result.public_id,

        url: result.secure_url,
      });
    }

    // console.log(imagesLinks, "imagesLinks create");
  } else if (req.body.isNewImage === "false") {
    imagesLinks = product.images;

    // console.log(product, "product update");
    // console.log(imagesLinks, "imagesLinks update");
  }

  // console.log(stop, "stop");

  // return res.status(400).send("STOP!");

  const updateProduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      price: req.body.price,
      brand: req.body.brand,
      description: req.body.description,
      type: req.body.type,
      category: req.body.category,
      stock: req.body.stock,
      images: imagesLinks,
      isWarranty: req.body.isWarranty,
    },
    { new: true }
  );

  if (product.price != req.body.price) {
    const priceHistory = new PriceHistory({
      product: product.id, // Set the product reference
      price: req.body.price, // Set the price from the product
      status:
        req.body.price < product.price
          ? "Decreased"
          : req.body.price > product.price
          ? "Increased"
          : "Initial", // Set the initial status
    });

    await priceHistory.save();

    console.log(priceHistory);
  }

  if (!updateProduct) {
    return res.status(500).send("The product cannot be updated!");
  } else {
    res.send(updateProduct);
  }
});

//delete product
router.delete("/:id", (req, res) => {
  Product.findByIdAndRemove(req.params.id)
    .then((product) => {
      if (product) {
        return res
          .status(200)
          .json({ success: true, message: "The product is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Product not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

router.put("/create-review/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const { comment, rating } = req.body;

    // Find the product by ID
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check if the user has already reviewed the product
    const existingReviewIndex = product.reviews.findIndex(
      (review) => review.user.toString() === req.body.user._id.toString()
    );

    if (existingReviewIndex !== -1) {
      // Update the existing review
      product.reviews[existingReviewIndex].rating = rating;
      product.reviews[existingReviewIndex].comment = comment;
    } else {
      // Create a new review object
      const newReview = {
        user: req.body.user._id,
        name: req.body.user.firstname + " " + req.body.user.lastname,
        rating: rating,
        comment: comment,
      };

      // Add the new review to the product's reviews array
      product.reviews.push(newReview);
    }

    // Update the total number of reviews
    product.numOfReviews = product.reviews.length;

    // Calculate the new average rating
    const totalRating = product.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    product.ratings = (totalRating / product.numOfReviews).toFixed(2);

    // Save the updated product
    const updatedProduct = await product.save();

    if (!updatedProduct) {
      return res
        .status(500)
        .send("The product review cannot be created or updated!");
    } else {
      res.send(updatedProduct);
    }
  } catch (error) {
    console.error("Error creating or updating review:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get(`/namesandstocks`, async (req, res) => {
  try {
    const productList = await Product.find();

    if (!productList || productList.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No products found" });
    }

    // const productData = productList.map(product => ({
    //   name: product.name,
    //   stock: product.stock,
    // }));

    res.status(200).json(productList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

//update product stock
router.put("/stock/:id", uploadOptions.array("images"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send("Invalid Product ID");
    }

    const product = await Product.findById(req.params.id).populate("brand");

    if (!product) {
      return res.status(400).send("Invalid Product!");
    }

    const user = await User.findById(req.body.user);

    if (!user) {
      return res.status(400).send("Invalid User!");
    }

    // Calculate stock change
    const stockChange = parseInt(product.stock) + parseInt(req.body.stock);

    const updateProduct = await Product.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { stock: stockChange },
        $push: {
          stockLogs: {
            name: product.name,
            brand: product.brand.name,
            quantity: req.body.stock,
            status: req.body.stock > 0 ? "Restocked" : "Sold",
            by: `${user.firstname} - ${user.role}`,
          },
        },
      },
      { new: true } // Return the updated document
    );

    console.log(updateProduct, "updateProduct");

    if (!updateProduct) {
      return res.status(500).send("The product stock cannot be updated!");
    } else {
      res.send(updateProduct);
    }
  } catch (error) {
    console.error("Error updating product stock:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/stockLogs", async (req, res) => {
  try {
    const allProducts = await Product.find({});
    let allStockLogs = [];

    allProducts.forEach((product) => {
      allStockLogs = allStockLogs.concat(product.stockLogs);
    });

    if (allStockLogs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No stock logs found for any product",
      });
    }

    // Sort the allStockLogs array by timestamp (assuming the timestamp field is called 'createdAt')
    allStockLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, stockLogs: allStockLogs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/price-history", async (req, res) => {
  try {
    // Fetch all price logs from PriceHistory model, sorted from latest to oldest
    const priceHistory = await PriceHistory.find()
      .sort({ createdAt: -1 }) // Sort by createdAt field in descending order (latest to oldest)
      .populate("product", "name images"); // Populate the 'product' field with its name

    res.json({ success: true, priceHistory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
