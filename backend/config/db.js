const mongoose = require("mongoose");

let connectionPromise = null;

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    throw new Error("MONGO_URI is not defined");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    await connectionPromise;
    return mongoose.connection;
  }

  connectionPromise = mongoose
    .connect(mongoURI, {
      dbName: "student_fee_system"
    })
    .then(() => {
      console.log("✅ MongoDB connected successfully");
      return mongoose.connection;
    })
    .catch((error) => {
      connectionPromise = null;

      if (error.name === "MongooseServerSelectionError") {
        console.error(
          "⚠️ Could not connect to any servers in the cluster. Check IP whitelist, replica set, and network."
        );
      }

      throw error;
    });

  await connectionPromise;
  return mongoose.connection;
};

module.exports = connectDB;
