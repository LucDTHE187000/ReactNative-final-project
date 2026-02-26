const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["Sân 5", "Sân 7", "Sân 11"],
      required: true,
    },
    pricePerHour: {
      type: Number,
      required: true,
    },
    capacity: {
      type: Number,
      default: 1,
    },
    image: {
      type: String,
      default: null,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Field", fieldSchema);
