const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/crimeDB")
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

// Models
const User = require("./models/User");
const Crime = require("./models/Crime");

// Signup
app.post("/signup", async (req,res)=>{
  try {
    const {username,email,password} = req.body || {};
    if (!username || !email || !password) return res.status(400).json({message:"Missing fields"});
    const hashed = await bcrypt.hash(password,10);
    await new User({username,email,password:hashed}).save();
    res.json({message:"Signup success"});
  } catch(err) {
    res.status(500).json({message: "Server error", error: err.message});
  }
});

// Login
app.post("/login", async (req,res)=>{
  try {
    const {email,password} = req.body || {};
    if (!email || !password) return res.status(400).json({message:"Missing fields"});
    const user = await User.findOne({email});
    if(!user) return res.json({message:"User not found"});

    const match = await bcrypt.compare(password,user.password);
    if(!match) return res.json({message:"Wrong password"});

    res.json({message:"Login success"});
  } catch(err) {
    res.status(500).json({message: "Server error", error: err.message});
  }
});

// Crime Data
app.post("/crime", async (req,res)=>{
  try {
    const {city,year} = req.body || {};
    if (!city || !year) return res.status(400).json({message:"Missing fields"});

    let data = await Crime.findOne({city,year});

    if(!data){
      data = new Crime({
        city,
        year,
        Burglary: Math.floor(Math.random()*200)+50,
        Assault: Math.floor(Math.random()*300)+70,
        Robbery: Math.floor(Math.random()*150)+30,
        Theft: Math.floor(Math.random()*400)+100,
        Murder: Math.floor(Math.random()*50)+5,
        Rape: Math.floor(Math.random()*80)+10
      });
      await data.save();
    }

    res.json(data);
  } catch(err) {
    res.status(500).json({message: "Server error", error: err.message});
  }
});

// Crime History (Yearly)
app.post("/crime/history", async (req,res)=>{
  try {
    const {city} = req.body || {};
    if (!city) return res.status(400).json({message:"Missing fields"});

    let history = [];
    for(let y=2015; y<=2026; y++){
      let data = await Crime.findOne({city, year:y});
      if(!data){
        data = new Crime({
          city, year:y,
          Burglary: Math.floor(Math.random()*200)+50,
          Assault: Math.floor(Math.random()*300)+70,
          Robbery: Math.floor(Math.random()*150)+30,
          Theft: Math.floor(Math.random()*400)+100,
          Murder: Math.floor(Math.random()*50)+5,
          Rape: Math.floor(Math.random()*80)+10
        });
        await data.save();
      }
      history.push(data);
    }
    res.json(history);
  } catch(err) {
    res.status(500).json({message: "Server error", error: err.message});
  }
});

app.listen(5000,()=>console.log("Server running on http://localhost:5000"));