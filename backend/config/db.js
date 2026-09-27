const mongoose = require("mongoose");
mongoose.set("bufferCommands", false);

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      console.warn("⚠️ Warning: No MONGODB_URI found in environment.");
      return;
    }
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ MongoDB Connection Error: ${error.message}`);
    console.warn("ℹ️ Server is running in resilient preview mode. Set a valid MONGODB_URI in backend/.env (e.g. MongoDB Atlas cluster) to enable live database writes.");
  }
};

module.exports = connectDB;
