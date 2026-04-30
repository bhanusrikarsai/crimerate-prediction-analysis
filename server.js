const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();

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

// Signup
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await new User({ username, email, password: hashed }).save();

    res.json({ message: "Signup success" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ message: "Wrong password" });

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