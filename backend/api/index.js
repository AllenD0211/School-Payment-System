const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const app = require("../app");
const connectDB = require("../config/db");
const ensureAdminUser = require("../utils/ensureAdminUser");

let bootPromise = null;

const bootstrap = async () => {
  if (!bootPromise) {
    bootPromise = (async () => {
      await connectDB();
      await ensureAdminUser();
    })().catch((error) => {
      bootPromise = null;
      throw error;
    });
  }

  await bootPromise;
};

module.exports = async (req, res) => {
  try {
    await bootstrap();
    return app(req, res);
  } catch (error) {
    console.error("Serverless bootstrap error:", error);
    return res.status(500).json({
      success: false,
      message: "Server initialization failed"
    });
  }
};
