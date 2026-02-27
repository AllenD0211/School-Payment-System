// models/eventModel.js
const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },

    // Store both date and time together
    eventDateTime: { type: Date, required: true },

    // Event location
    location: {
      type: String,
      default: "",
    },
  },
  { timestamps: true, collection: "events" }
);

module.exports = mongoose.model("Event", eventSchema);
