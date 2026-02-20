require("dotenv").config();
const express = require("express");
// const connectDB = require("./config/db");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const emailRoutes = require("./routes/email");

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

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
