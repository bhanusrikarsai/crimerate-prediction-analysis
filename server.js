require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const app = express();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ✅ FIXED MongoDB Connection (removed old options)
mongoose.connect("mongodb://127.0.0.1:27017/crimeDB")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Models
const User = require("./models/User");
const Crime = require("./models/Crime");
const Otp = require("./models/Otp");

// Send OTP
app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ message: "User already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[DEV] OTP for signup (${email}) is: ${otp}`);

    await Otp.findOneAndUpdate(
      { email },
      { email, otp, createdAt: Date.now() },
      { upsert: true, returnDocument: 'after' }
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Crime Rate Prediction System OTP",
      text: `Your OTP for signup is: ${otp}. It will expire in 5 minutes.`
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Signup
app.post("/signup", async (req, res) => {
  try {
    const { email, password, otp } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ message: "User already exists" });
    }

    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.json({ message: "Invalid or expired OTP" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await new User({ email, password: hashed }).save();

    await Otp.deleteOne({ email });

    res.json({ message: "Signup success" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login Step 1
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ message: "Wrong password" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[DEV] OTP for login (${email}) is: ${otp}`);

    await Otp.findOneAndUpdate(
      { email },
      { email, otp, createdAt: Date.now() },
      { upsert: true, returnDocument: 'after' }
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Crime Rate Prediction System Login OTP",
      text: `Your OTP for login is: ${otp}. It will expire in 5 minutes.`
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Verify Login
app.post("/verify-login", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.json({ message: "Invalid or expired OTP" });
    }

    await Otp.deleteOne({ email });

    res.json({ message: "Login success" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Crime Data
app.post("/crime", async (req, res) => {
  try {
    const { city, year } = req.body;

    let data = await Crime.findOne({ city, year });

    if (!data) {
      data = new Crime({
        city,
        year,
        Burglary: Math.floor(Math.random() * 200) + 50,
        Assault: Math.floor(Math.random() * 300) + 70,
        Robbery: Math.floor(Math.random() * 150) + 30,
        Theft: Math.floor(Math.random() * 400) + 100,
        Murder: Math.floor(Math.random() * 50) + 5,
        Rape: Math.floor(Math.random() * 30) + 2
      });

      await data.save();
    }

    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Crime History Data
app.post("/crime/history", async (req, res) => {
  try {
    const { city } = req.body;
    let history = await Crime.find({ city }).sort({ year: 1 });
    
    // Generate some history if none exists or very few exist
    if (history.length < 5) {
      const startYear = 2015;
      const endYear = new Date().getFullYear();
      
      for (let y = startYear; y <= endYear; y++) {
        let existing = await Crime.findOne({ city, year: y });
        if (!existing) {
          existing = new Crime({
            city,
            year: y,
            Burglary: Math.floor(Math.random() * 200) + 50,
            Assault: Math.floor(Math.random() * 300) + 70,
            Robbery: Math.floor(Math.random() * 150) + 30,
            Theft: Math.floor(Math.random() * 400) + 100,
            Murder: Math.floor(Math.random() * 50) + 5,
            Rape: Math.floor(Math.random() * 30) + 2
          });
          await existing.save();
        }
      }
      history = await Crime.find({ city }).sort({ year: 1 });
    }

    res.json(history);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Server
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});