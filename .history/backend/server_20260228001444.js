require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const emailRoutes = require("./routes/emailRoutes");
const studentsRoutes = require("./routes/studentRoutes");
const parentRoutes = require("./routes/parentRoutes");
const eventRoutes = require("./routes/eventRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const feeRoutes = require("./routes/feeRoutes");

const PORT = process.env.PORT || 5000;

const app = express();

// Email
app.use("/api", emailRoutes);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Connect to DB
connectDB();

// Routes
app.get("/", (req, res) => res.send("API running..."));
app.use("/api/auth", authRoutes);

// Student routes
app.use("/api/students", studentsRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/notifications", notificationRoutes);

// Admin routes
app.use("/api/admin", adminRoutes);

// All users
app.use("/api/fees", feeRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
