const express = require("express");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler");
require("dotenv/config");
const cloudinary = require("cloudinary");
var bodyParser = require("body-parser");

app.use(cors());
app.options("*", cors());

//middleware
app.use(express.json());
app.use(morgan("tiny"));
app.use(authJwt());
app.use(errorHandler);
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

//Cloudinary API
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//Routes
const usersRoutes = require("./routes/users");
const productsRoutes = require("./routes/products");
const categoriesRoutes = require("./routes/categories");
const brandsRoutes = require("./routes/brands");
const ordersRoutes = require("./routes/orders");
const servicesRoutes = require("./routes/services");
const serviceCategoriesRoutes = require("./routes/serviceCategories");
const motorcyclesRoutes = require("./routes/motorcycles");
const fuelRoutes = require("./routes/fuels");
const addressRoutes = require("./routes/addresses");
const appointmentRoutes = require("./routes/appointments");
const dashboardRoutes = require("./routes/dashboards");
const feedbackRoutes = require("./routes/feedbacks");
const supplierLogRoutes = require("./routes/supplierLogs");
const notificationRoutes = require("./routes/notifications");

const api = process.env.API_URL;

app.use(`${api}/users`, usersRoutes);
app.use(`${api}/products`, productsRoutes);
app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/brands`, brandsRoutes);
app.use(`${api}/orders`, ordersRoutes);
app.use(`${api}/services`, servicesRoutes);
app.use(`${api}/serviceCategories`, serviceCategoriesRoutes);
app.use(`${api}/motorcycles`, motorcyclesRoutes);
app.use(`${api}/fuels`, fuelRoutes);
app.use(`${api}/addresses`, addressRoutes);
app.use(`${api}/appointments`, appointmentRoutes);
app.use(`${api}/dashboards`, dashboardRoutes);
app.use(`${api}/feedbacks`, feedbackRoutes);
app.use(`${api}/supplierLogs`, supplierLogRoutes);
app.use(`${api}/notifications`, notificationRoutes);

//Database
mongoose
  .connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database Connection is ready...");
  })
  .catch((err) => {
    console.log(err);
  });

//Server
app.listen(4000, () => {
  console.log("server is running http://localhost:4000");
});
