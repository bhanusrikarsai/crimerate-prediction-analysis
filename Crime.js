const mongoose = require("mongoose");

const CrimeSchema = new mongoose.Schema({
city:String,
year:Number,
Burglary:Number,
Assault:Number,
Robbery:Number,
Theft:Number,
Murder:Number,
Rape:Number
});

module.exports = mongoose.model("Crime",CrimeSchema);