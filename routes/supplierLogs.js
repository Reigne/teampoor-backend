const express = require("express");
const router = express.Router();
const { SupplierLog } = require("../models/supplierLog");
const { User } = require("../models/user");
const { Product } = require("../models/product");

// Route to handle the submission of supplier logs
router.post("/", async (req, res) => {
  try {
    // Extract data from the request body
    const { supplier, products, invoiceId, notes, dateDelivered, totalPrice } =
      req.body;

    // Fetch the supplier's name using the supplier ID
    const supplierData = await User.findById(supplier);

    if (!supplierData) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    // Create a new instance of the SupplierLog model
    const newSupplierLog = new SupplierLog({
      supplier,
      products,
      invoiceId,
      notes,
      dateDelivered,
      totalPrice,
    });

    // Save the new supplier log to the database
    await newSupplierLog.save();

    console.log(newSupplierLog, "save await");

    // Insert stock logs for each product
    await Promise.all(
      products.map(async (product) => {
        const { productName, quantity, id } = product;

        console.log(id, "id");

        // Assuming you have a Product model where you store stock logs
        const productData = await Product.findOne({ _id: id });

        console.log(productData, "find one");

        if (!productData) {
          console.log(`Product not found: ${productName}`);
          return res
            .status(404)
            .json({ error: `Product not found: ${productName}` });
        }

        // Create a new stock log
        const stockLog = {
          name: productName,
          quantity: quantity,
          status: "Restocked", // You can set the status as needed
          by:
            supplierData.firstname +
            " " +
            supplierData.lastname +
            " - " +
            supplierData.role, // Using the name of the supplier fetched from the database
        };

        // Add the stock log to the product's stockLogs array
        productData.stockLogs.push(stockLog);

        productData.stock += quantity;

        // Save the product with the updated stockLogs
        await productData.save();
      })
    );

    // Respond with a success message
    return res
      .status(201)
      .json({ message: "Supplier log created successfully" });
  } catch (error) {
    // Handle errors and respond with an error message
    console.error("Error submitting supplier log:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while submitting the supplier log" });
  }
});

// Route to get all supplier logs with population of associated users
router.get("/", async (req, res) => {
  try {
    // Fetch all supplier logs and populate the 'supplier' field with associated user data
    const supplierLogs = await SupplierLog.find()
      .populate("supplier", "firstname lastname email avatar")
      .sort({ _id: -1 }); // Sort by _id field in descending order;
    // .populate("products.product");

    // Respond with the fetched supplier logs
    //   return res.status(200).json({ supplierLogs });

    console.log(supplierLogs);

    return res.send(supplierLogs);
  } catch (error) {
    // Handle errors and respond with an error message
    console.error("Error fetching supplier logs:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching supplier logs" });
  }
});

module.exports = router;
