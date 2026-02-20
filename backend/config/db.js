// const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    console.error("❌ MONGO_URI not defined in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI, {
      // These options are defaults now; you can omit them
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);

    if (error.name === "MongooseServerSelectionError") {
      console.error(
        "⚠️ Could not connect to any servers in the cluster. Check IP whitelist, replica set, and network."
      );
    }

    process.exit(1);
  }
};

module.exports = connectDB;
