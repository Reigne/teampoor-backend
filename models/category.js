const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  images: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
});

categorySchema.virtual("id").get(function () {
  return this._id.toHexString();
});

categorySchema.set("toJSON", {
  virtuals: true,
});

exports.Category = mongoose.model("Category", categorySchema);
