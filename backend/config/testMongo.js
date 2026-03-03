const mongoose = require("mongoose");

const uri = "mongodb+srv://allendavedeala_db_user:hTJV3xRJqOUaEFKM@cluster0.bpi5nck.mongodb.net/student_fee_system";

mongoose.connect(uri)
  .then(() => console.log("✅ Connected to MongoDB!"))
  .catch(err => console.error("❌ Connection failed:", err.message));