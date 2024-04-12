const { Order } = require("../models/order");
const { OrderItem } = require("../models/order-item");
const { Product } = require("../models/product");
const { Fuel } = require("../models/fuel");
const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const axios = require("axios");
const crypto = require("crypto");
const { PaymongoToken } = require("../models/paymongoToken");
const mongoose = require("mongoose");
const { log } = require("console");
const { Notification } = require("../models/notification");
const axiosRetry = require('axios-retry').default;


// Create a transporter object using your Gmail credentials
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "reignelegend18@gmail.com",
    pass: "arxzlvahlfuzmbvk",
  },
});

// Add this line after importing axios and axios-retry
axiosRetry(axios, {
  retries: 5,
  retryDelay: axiosRetry.exponentialDelay,
  shouldResetTimeout: true,
});

// Function to handle PayMongo checkout
const handlePayMongo = async (orderItemsDetails, temporaryLink) => {
  try {
    const lineItems = orderItemsDetails.map((orderItem) => ({
      currency: "PHP",
      amount: orderItem.price * orderItem.quantity * 100, // Assuming price is stored in orderItem
      description: orderItem.productName,
      name: orderItem.productName,
      quantity: orderItem.quantity,
    }));

    const options = {
      method: "POST",
      url: "https://api.paymongo.com/v1/checkout_sessions",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        authorization:
          "Basic c2tfdGVzdF9KMlBMVlp3ZHV3OExwV3hGeWhZZnRlQWQ6cGtfdGVzdF9kYmpQaUZDVGJqaHlUUnVCbmVRdW1OSkY=",
      },
      data: {
        data: {
          attributes: {
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            line_items: lineItems,
            payment_method_types: ["gcash"],
            description: "Order payment",
            success_url: `${temporaryLink}`,
          },
        },
      },
    };

    const response = await axios.request(options);
    const checkoutUrl = response.data.data.attributes.checkout_url;

    return checkoutUrl;
  } catch (error) {
    console.error("Error creating PayMongo checkout session:", error);
    throw error;
  }
};



const sendEmail = async (userDetails, orderDetails, orderItemsDetails) => {
  try {
    // Send email
    await transporter.sendMail({
      from: "reignelegend18@gmail.com",
      to: "reignelegend18@gmail.com",
      subject: "Order Confirmation",
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
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
              .order-item {
                  list-style: none;
                  margin-bottom: 10px;
                  padding-left: 30px; /* Add padding to the left of each item */
                  background-image: url('path_to_your_image'); /* Add background image */
                  background-repeat: no-repeat;
                  background-size: 20px; /* Adjust the size of the background image */
                  background-position: left center; /* Position the background image */
              }
              .total-price {
                  font-weight: bold;
                  font-size: 1.2em;
              }
              .order-confirm {
                  text-align: center;
                  padding-bottom: 20px;
              }
          </style>
      </head>
      <body>
      <header>
      <h2>Order Confirmation</h2>     
      </header>
      <main>
          <p>Dear ${orderDetails.fullname},</p>
          <p>Your order has been successfully placed. Below are the details of your order:</p>
          <ul>
              ${orderItemsDetails
                .map(
                  (orderItem) => `
                  <li class="order-item">${orderItem.quantity} x ${orderItem.productName}</li>
              `
                )
                .join("")}
          </ul>
          <p class="total-price">Total Price: ₱${orderDetails.totalPrice}</p>
          <p>We will notify you once your order is processed and shipped.</p>
          <p>For any inquiries regarding your order, please contact our customer support.</p>
          <p>Thank you for shopping with us!</p>
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

const sendOrderDeliveredEmail = async (orderDetails, message) => {
  try {
    // Send email
    await transporter.sendMail({
      from: "reignelegend18@gmail.com",
      to: "reignelegend18@gmail.com",
      subject: "Order Confirmation",
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
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
              .order-item {
                  list-style: none;
                  margin-bottom: 10px;
                  padding-left: 30px; /* Add padding to the left of each item */
                  background-image: url('path_to_your_image'); /* Add background image */
                  background-repeat: no-repeat;
                  background-size: 20px; /* Adjust the size of the background image */
                  background-position: left center; /* Position the background image */
              }
              .total-price {
                  font-weight: bold;
                  font-size: 1.2em;
              }
              .order-confirm {
                  text-align: center;
                  padding-bottom: 20px;
              }
          </style>
      </head>
      <body>
      <header>
      <h2>Order Delivered</h2>     
      </header>
      <main>
          <p>Dear ${orderDetails.fullname},</p>
          <p>${message}</p>
          <ul>
              ${orderDetails.orderItems
                .map(
                  (orderItem) => `
                  <li class="order-item">${orderItem.quantity} x ${orderItem.product.name}</li>
              `
                )
                .join("")}
          </ul>
          <p class="total-price">Total Price: ₱${orderDetails.totalPrice}</p>
          <p>Thank you for shopping with us!</p>
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

const SendSMS = async (orderDetails, message) => {
  var https = require("follow-redirects").https;
  var fs = require("fs");

  var options = {
    method: "POST",
    hostname: "2vg58m.api.infobip.com",
    path: "/sms/2/text/advanced",
    headers: {
      Authorization:
        "App 2b08d6f8c86c9293662c3d7ccb90080e-f3f93ef0-c3c7-4329-b4d6-577aea1e2a05",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    maxRedirects: 20,
  };

  var req = https.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function (chunk) {
      var body = Buffer.concat(chunks);
      console.log(body.toString());
    });

    res.on("error", function (error) {
      console.error(error);
    });
  });

  // Convert phone number format before sending SMS
  var convertedPhoneNumber = orderDetails.phone.replace(/^0/, "63");

  var postData = JSON.stringify({
    messages: [
      {
        destinations: [{ to: convertedPhoneNumber }],
        from: "Team",
        text: `Hello ${orderDetails.fullname},\n${message}`,
      },
    ],
  });

  req.write(postData);

  req.end();
};

router.get("/", async (req, res) => {
  try {
    const orderList = await Order.find()
      .populate({
        path: "user",
      })
      .populate({
        path: "orderItems",
        populate: { path: "product", model: "Product" },
      })
      .sort({ dateOrdered: -1 })
      .lean();

    // console.log(orderList, "orderlist");

    if (!orderList) {
      return res.status(500).json({ success: false });
    }

    res.send(orderList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get("/notification", async (req, res) => {
  try {
    const orderList = await Order.find()
      .populate({
        path: "user",
      })
      .populate({
        path: "orderItems",
        populate: { path: "product", model: "Product" },
      })
      .sort({ dateOrdered: -1 })
      .lean();

    // console.log(orderList, "orderlist");

    if (!orderList) {
      return res.status(500).json({ success: false });
    }

    res.send(orderList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Get orders by a specific user's ID
router.get("/user/:id", async (req, res) => {
  try {
    // console.log(req.params.id, "user id");
    const userId = req.params.id;

    // Check if the user exists
    const user = await User.findById(userId);

    console.log(user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find orders by the user's ID
    const orders = await Order.find({ user: userId })
      .populate({
        path: "user",
      })
      .populate({
        path: "orderItems",
        populate: { path: "product", model: "Product" },
      })
      .lean();

    // console.log(orders);

    res.send(orders);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const validationErrors = [];

    const user = await User.findOne({ _id: req.body.user });

    if (!user) {
      return res.status(400).send("The user not found");
    }

    const orderItemsDetails = [];

    const orderItemsIds = await Promise.all(
      req.body.orderItems.map(async (orderItem) => {
        const product = await Product.findById(orderItem.id).populate("brand");

        if (!product) {
          validationErrors.push(`Product with ID ${orderItem.id} not found.`);
          return null;
        }

        if (product.stock <= 0) {
          validationErrors.push(`Out of stock of product ${product.name}.`);
          return null;
        }

        if (product.stock < orderItem.quantity) {
          validationErrors.push(`Not enough stock of product ${product.name}.`);
          return null;
        }

        if (req.body.paymentMethod === "Cash On Delivery") {
          // Log the stock change
          // product.stock -= orderItem.quantity;
          const stockChange = -orderItem.quantity; // Negative quantity for a sold product

          // Update the stockLogs
          product.stockLogs.push({
            name: product.name,
            brand: product.brand.name,
            quantity: stockChange,
            status: "Sold",
            by: `${user.firstname} - ${user.role}`,
          });

          if (product) {
            product.stock -= orderItem.quantity;
            await product.save();
          }
        }

        let newOrderItem = new OrderItem({
          quantity: orderItem.quantity,
          product: orderItem.id,
        });

        orderItemsDetails.push({
          productName: product.name,
          quantity: orderItem.quantity,
          price: product.price,
        });

        newOrderItem = await newOrderItem.save();
        return newOrderItem._id;
      })
    );

    // Check if there were validation errors
    if (validationErrors.length > 0) {
      console.log(validationErrors);
      return res.status(400).send(validationErrors.join("\n"));
    }

    const initialOrderStatus = {
      // Add the initial status when creating the order
      status: req.body.paymentMethod === "GCash" ? "TOPAY" : "Pending",
      timestamp: new Date(),
      message:
        req.body.paymentMethod === "GCash"
          ? "Order placed successfully. Proceed to payment using GCash."
          : "Order placed successfully.",
    };

    let order = new Order({
      orderItems: orderItemsIds,
      user: req.body.user,
      fullname: req.body.fullname,
      phone: req.body.phone,
      region: req.body.region,
      province: req.body.province,
      city: req.body.city,
      barangay: req.body.barangay,
      postalcode: req.body.postalcode,
      address: req.body.address,
      orderStatus: [initialOrderStatus], // Include the initial order status
      totalPrice: req.body.totalPrice,
      customerUser: req.body.customerUser,
      employeeUser: req.body.employeeUser,
      dateOrdered: req.body.dateOrdered,
      dateReceived: req.body.dateReceived,
      paymentMethod: req.body.paymentMethod,
    });

    order = await order.save();

    const orderObject = order.toObject();

    console.log(orderItemsDetails, "this is order");

    const paymongoToken = await new PaymongoToken({
      orderId: order._id,
      token: crypto.randomBytes(32).toString("hex"),
      verificationTokenExpire: new Date(Date.now() + 2 * 60 * 1000),
    }).save();

    sendEmail(user, order, orderItemsDetails);

    if (req.body.paymentMethod === "GCash") {
      const temporaryLink = `http://192.168.100.93:4000/api/v1/orders/paymongo-gcash/${paymongoToken.token}/${order._id}`;

      const checkoutUrl = await handlePayMongo(
        orderItemsDetails,
        temporaryLink
      );

      console.log(checkoutUrl, "checkout");

      return res.json({ checkoutUrl });
    }

    return res.send(orderObject);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});

router.get("/payment/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(400).send("Invalid Link");
    }

    console.log(order, "order");

    const orderItemsDetails = [];

    for (const orderItemId of order.orderItems) {
      console.log(orderItemId);

      const orderItem = await OrderItem.findById(orderItemId).populate(
        "product"
      );

      if (!orderItem) {
        return res
          .status(404)
          .send(`Order item with ID ${orderItemId} not found`);
      }

      orderItemsDetails.push({
        productId: orderItem.product._id, // assuming 'product' is the populated field
        productName: orderItem.product.name,
        quantity: orderItem.quantity,
        price: orderItem.product.price,
      });
    }

    console.log(orderItemsDetails, "item details");

    let paymongoToken = await PaymongoToken.findOne({ orderId: order._id });

    const temporaryLink = `http://192.168.100.93:4000/api/v1/orders/paymongo-gcash/${paymongoToken.token}/${order._id}`;

    const checkoutUrl = await handlePayMongo(orderItemsDetails, temporaryLink);

    console.log(checkoutUrl, "checkout");

    res.json({ checkoutUrl });

    // res.send(user);
  } catch (error) {
    // Handle any other errors that may occur during the process
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/paymongo-gcash/:token/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate({
      path: "orderItems",
      populate: {
        path: "product",
        model: "Product",
        populate: {
          path: "brand",
          model: "Brand",
        },
      },
    });

    if (!order) {
      return res.status(400).send("Invalid Link");
    }

    const user = await User.findOne({ _id: order.user });

    let paymongoToken = await PaymongoToken.findOne({ orderId: order._id });

    if (paymongoToken) {
      paymongoToken.token = req.params.token;
      await paymongoToken.save();
    } else {
      paymongoToken = new PaymongoToken({
        orderId: order._id,
        token: req.params.token,
      });
      await paymongoToken.save();
    }

    // Deduct product stock from order items and update stockLogs
    for (const orderItem of order.orderItems) {
      const product = orderItem.product;
      if (!product) {
        return res
          .status(404)
          .send(`Product not found for order item: ${orderItem}`);
      }
      const stockChange = -orderItem.quantity;

      // Update product stock
      await Product.updateOne(
        { _id: product._id },
        { $inc: { stock: stockChange } }
      );

      // Update stockLogs
      product.stockLogs.push({
        name: product.name,
        brand: product.brand.name,
        quantity: stockChange,
        status: "Sold",
        by: `${user.firstname} - ${user.role}`,
      });

      await product.save();
    }

    // Update order status to "PAID"
    const orderStatusUpdatePaid = {
      status: "PAID",
      timestamp: new Date(),
      message: "Payment completed successfully",
    };

    order.orderStatus.push(orderStatusUpdatePaid);

    // Update order status to "TOSHIP"
    // const orderStatusUpdateToShip = {
    //   status: "TOSHIP",
    //   timestamp: new Date(),
    //   message: "TeamPOOR is preparing to ship your order",
    // };

    // order.orderStatus.push(orderStatusUpdateToShip);

    // Set isPaid field to true
    order.isPaid = true;

    await order.save();

    res.status(200).json({ message: "Payment completed successfully" });
  } catch (error) {
    // Handle any other errors that may occur during the process
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// const paymongo = async (orders) => {
//   try {
//     // Initialize PayMongo SDK with your secret key


//     // Create a source
//     paymongo.links
//       .create({
//         amount: 10000,
//         currency: "PHP",
//         description: "TeamPOOR",
//         payment_method_allowed: "gcash", // Define allowed payment methods
//         type: "gcash",
//         redirect: {
//           success: "https://google.com",
//           failed: "https://google.com",
//         },
//       })
//       .then(function (resource) {
//         console.log(resource); // Log the resource for debugging
//         // Send the created resource back to the frontend
//         // return res.status(200).json({ resource });
//         res.send(resource);
//       })
//       .catch(function (e) {
//         if (e.type === "AuthenticationError") {
//           console.log("auth error");
//         } else if (e.type === "RouteNotFoundError") {
//           console.log("route not found");
//         } else if (e.type === "InvalidRequestError") {
//           console.log(e.errors);
//         }
//         // Handle other errors and send appropriate responses
//         return res.status(400).json({ error: e.message });
//       });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).send("Internal Server Error");
//   }
// };

// router.post("/", async (req, res) => {
//   try {
//     // Initialize PayMongo SDK with your secret key
// 

//     // Create a source
//     paymongo.links
//       .create({
//         amount: 10000,
//         currency: "PHP",
//         description: "TeamPOOR",
//         payment_method_allowed: "gcash", // Define allowed payment methods
//         type: "gcash",
//         redirect: {
//           success: "https://google.com",
//           failed: "https://google.com",
//         },
//       })
//       .then(function (resource) {
//         console.log(resource); // Log the resource for debugging
//         // Send the created resource back to the frontend
//         // return res.status(200).json({ resource });
//         res.send(resource);
//       })
//       .catch(function (e) {
//         if (e.type === "AuthenticationError") {
//           console.log("auth error");
//         } else if (e.type === "RouteNotFoundError") {
//           console.log("route not found");
//         } else if (e.type === "InvalidRequestError") {
//           console.log(e.errors);
//         }
//         // Handle other errors and send appropriate responses
//         return res.status(400).json({ error: e.message });
//       });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).send("Internal Server Error");
//   }
// });

router.put("/:id", async (req, res) => {
  try {
    let message = "";

    if (req.body.status === "TOPAY") {
      message = "Please proceed to payment for your order.";
    } else if (req.body.status === "TOSHIP") {
      message = "Your order is prepared and ready for shipping.";
    } else if (req.body.status === "TORECEIVED") {
      message = "Your order is currently out for delivery.";
    } else if (req.body.status === "FAILEDATTEMPT") {
      message = "Your recent delivery attempt was unsuccessful.";
    } else if (req.body.status === "RETURNED") {
      message =
        "Unfortunately, we were unable to deliver your order despite multiple attempts. It has been returned to our facility.";
    } else if (req.body.status === "DELIVERED") {
      message = "Your order has been successfully delivered.";
    } else if (req.body.status === "CANCELLED") {
      message = "Your order has been cancelled.";
    } else if (req.body.status === "COMPLETED") {
      message = "Your order has been completed.";
    }

    console.log(message);
    console.log(req.body.status);

    const updateFields = {
      $push: {
        // Use $push to add a new order status to the array
        orderStatus: {
          status: req.body.status,
          timestamp: new Date(),
          message: message, // You can customize the message
        },
      },
    };

    if (req.body.status === "Delivered") {
      updateFields.dateReceived = new Date();
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
    });

    const orderDetails = await Order.findById(req.params.id).populate({
      path: "orderItems",
      populate: { path: "product", model: "Product" },
    });

    console.log(orderDetails.orderItems, "sadasdasdasdasdasda");

    if (req.body.status === "TORECEIVED") {
      SendSMS(orderDetails, message);

      let notification = new Notification({
        user: order.user,
        title: "Your Parcel is Out for Delivery",
        // message: `Your motorcycle has reached 1500 kilometers on the odometer. It's time to schedule Preventive Maintenance Service (PMS).`,
        message: `Order #${order._id} is Out for Delivery`,
      });

      notification = await notification.save();
    } else if (req.body.status === "FAILEDATTEMPT") {
      SendSMS(orderDetails, message);
    } else if (req.body.status === "DELIVERED") {
      SendSMS(orderDetails, message);
      sendOrderDeliveredEmail(orderDetails, message);
    } else if (req.body.status === "RETURNED") {
      SendSMS(orderDetails, message);
    }

    if (!order) return res.status(400).send("The order cannot be updated!");

    res.send(order);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});

router.put("/:orderId/update-status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    let updateFields = { status };

    if (status === "Delivered") {
      // If the status is "Delivered", update the dateReceived to the current date
      updateFields.dateReceived = new Date();
    }

    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateFields, {
      new: true,
    });

    if (!updatedOrder) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    return res.json({ success: true, updatedOrder });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});

// router.put("/:orderId/update-status", async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { status } = req.body;

//     let updateFields = { status };

//     if (status === "Delivered") {
//       // If the status is "Delivered", update the dateReceived to the current date
//       updateFields.dateReceived = new Date();
//     }

//     const updatedOrder = await Order.findByIdAndUpdate(orderId, updateFields, {
//       new: true,
//     });

//     if (!updatedOrder) {
//       return res.status(404).json({ success: false, error: "Order not found" });
//     }

//     return res.json({ success: true, updatedOrder });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).send("Internal Server Error");
//   }
// });

router.get("/total-cost/last-30-days/:id", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalCost = await Order.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.params.id), // Use new keyword here
          dateOrdered: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalCost: { $sum: "$totalPrice" },
        },
      },
    ]);

    if (totalCost.length === 0) {
      return res.json({ totalCost: 0 });
    }

    res.json({ totalCost: totalCost[0].totalCost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Get the total cost of all orders for all time
router.get("/total-cost/all-time", async (req, res) => {
  try {
    const totalCost = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
        },
      },
    ]);

    if (totalCost.length === 0) {
      return res.json({ total: 0 });
    }

    res.json({ total: totalCost[0].total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Define the new route
router.get("/total-expenses/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    // Fetch total fuel expenses for the specified user
    const totalFuelExpenses = await Fuel.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.params.id), // Use new keyword here
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalCost" }, // Assuming fuel cost is stored as "cost"
        },
      },
    ]);

    // Fetch total order expenses for the specified user
    const totalOrderExpenses = await Order.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.params.id), // Use new keyword here
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" }, // Assuming total price of order is stored as "totalPrice"
        },
      },
    ]);

    // Calculate the total expenses by summing fuel and order expenses
    const totalExpenses =
      (totalFuelExpenses[0]?.total || 0) + (totalOrderExpenses[0]?.total || 0);

    // Return the total expenses as a response
    res.json({ totalExpenses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;
