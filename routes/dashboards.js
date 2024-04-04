const { Product } = require("../models/product");
const { User } = require("../models/user");
const { Category } = require("../models/category");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Service } = require("../models/service");
const { Appointment } = require("../models/appointment");
const { Order } = require("../models/order");
const { Brand } = require("../models/brand");
const { Motorcycle } = require("../models/motorcycle");
const { OrderItem } = require("../models/order-item");

// Define the route for fetching total products
router.get("/total-products", async (req, res) => {
  try {
    // Fetch the total number of products
    const totalProducts = await Product.countDocuments();

    // Send the total number of products as JSON response with status code 200
    res.status(200).json({ totalProducts });
  } catch (error) {
    console.error(error);
    // Handle errors appropriately with a 500 status code
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Define the route for fetching total products
router.get("/total-services", async (req, res) => {
  try {
    // Fetch the total number of products
    const totalServices = await Service.countDocuments();

    // Send the total number of products as JSON response with status code 200
    res.status(200).json({ totalServices });
  } catch (error) {
    console.error(error);
    // Handle errors appropriately with a 500 status code
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get("/total-appointments", async (req, res) => {
  try {
    // Fetch the total number of products
    const totalAppointments = await Appointment.countDocuments();

    // Send the total number of products as JSON response with status code 200
    res.status(200).json({ totalAppointments });
  } catch (error) {
    console.error(error);
    // Handle errors appropriately with a 500 status code
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get("/total-orders", async (req, res) => {
  try {
    // Fetch the total number of products
    const totalOrders = await Order.countDocuments();

    // Send the total number of products as JSON response with status code 200
    res.status(200).json({ totalOrders });
  } catch (error) {
    console.error(error);
    // Handle errors appropriately with a 500 status code
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get("/total-brands", async (req, res) => {
  try {
    // Fetch the total number of products
    const totalBrands = await Brand.countDocuments();

    // Send the total number of products as JSON response with status code 200
    res.status(200).json({ totalBrands });
  } catch (error) {
    console.error(error);
    // Handle errors appropriately with a 500 status code
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get("/total-categories", async (req, res) => {
  try {
    // Fetch the total number of products
    const totalCategories = await Category.countDocuments();

    // Send the total number of products as JSON response with status code 200
    res.status(200).json({ totalCategories });
  } catch (error) {
    console.error(error);
    // Handle errors appropriately with a 500 status code
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get("/total-users", async (req, res) => {
  try {
    // Fetch the total number of products
    const totalUsers = await User.countDocuments();

    // Send the total number of products as JSON response with status code 200
    res.status(200).json({ totalUsers });
  } catch (error) {
    console.error(error);
    // Handle errors appropriately with a 500 status code
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get("/total-motorcycles", async (req, res) => {
  try {
    // Fetch the total number of products
    const totalMotorcycles = await Motorcycle.countDocuments();

    // Send the total number of products as JSON response with status code 200
    res.status(200).json({ totalMotorcycles });
  } catch (error) {
    console.error(error);
    // Handle errors appropriately with a 500 status code
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Assuming you have a model named Product with a stock field
router.get("/product-stocks", async (req, res) => {
  try {
    const products = await Product.find({}, "name stock").sort({ stock: -1 }); // Fetching only name and stock fields
    // res.json(products);
    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to fetch order data for the line chart
router.get("/orders-charts", async (req, res) => {
  try {
    // Aggregate orders by date
    const orders = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$dateOrdered" } }, // Assuming dateOrdered field represents the date
          totalOrders: { $sum: 1 }, // Counting the number of orders for each day
        },
      },
      { $sort: { _id: 1 } }, // Sort by date
    ]);

    console.log(orders, "asdasdasd");
    res.status(200).json({ orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/most-purchased-product", async (req, res) => {
  try {
    const mostPurchasedProducts = await OrderItem.aggregate([
      {
        $group: {
          _id: "$product", // Group by product
          totalQuantity: { $sum: "$quantity" }, // Calculate total quantity of each product
        },
      },
      {
        $sort: { totalQuantity: -1 }, // Sort in descending order of total quantity
      }
    ]);

    console.log(mostPurchasedProducts, 'asdasdasdas');

    if (mostPurchasedProducts.length > 0) {
      const productIds = mostPurchasedProducts.map(item => item._id);
      const products = await Product.find({ _id: { $in: productIds } });

      // Construct response object with product name and total quantity
      const response = mostPurchasedProducts.map(item => {
        const product = products.find(product => product._id.toString() === item._id.toString());
        return {
          productName: product.name,
          sold: item.totalQuantity
        };
      });

      console.log("mostPurchasedProducts", response);

      res.status(200).json({ mostPurchasedProducts: response });
    } else {
      res.status(404).json({ message: "No orders found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



module.exports = router;
