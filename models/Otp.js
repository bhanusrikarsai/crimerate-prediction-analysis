const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  createdAt: { type: Date, default: Date.now, expires: 300 } // TTL index: document will expire after 5 minutes (300 seconds)
});

module.exports = mongoose.model("Otp", OtpSchema);
