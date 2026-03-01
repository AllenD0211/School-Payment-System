const mongoose = require("mongoose");

const parentLinkRequestSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      required: true
    },
    parentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    studentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    resolutionNote: {
      type: String,
      default: "",
      trim: true
    }
  },
  { timestamps: true }
);

parentLinkRequestSchema.index({
  studentUserId: 1,
  status: 1,
  createdAt: -1
});

parentLinkRequestSchema.index(
  {
    parentUserId: 1,
    studentUserId: 1,
    status: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      status: "pending"
    }
  }
);

module.exports = mongoose.model("ParentLinkRequest", parentLinkRequestSchema);
