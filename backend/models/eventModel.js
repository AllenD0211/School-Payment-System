// models/eventModel.js
const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    eventDate: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);