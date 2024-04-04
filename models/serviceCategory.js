const mongoose = require("mongoose");

const serviceCategorySchema = mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  image: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
});

serviceCategorySchema.virtual("id").get(function () {
  return this._id.toHexString();
});

serviceCategorySchema.set("toJSON", {
  virtuals: true,
});

exports.ServiceCategory = mongoose.model(
  "ServiceCategory",
  serviceCategorySchema
);
