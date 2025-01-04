// const { default: mongoose } = require("mongoose");

// const experienceSchema = new mongoose.Schema({
//     title: String,
//     companyName: String,
//     location: String,
//     locationType: String,
//     employementType: String,
//     currentlyWorkingHere: Boolean,
//     startDate: String,
//     startYear: Number,
//     endDate: String,
//     endYear: Number
//   },{timestamps:true});

//   module.exports=mongoose.model("exprence",experienceSchema)

const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema(
  {
    title: String,
    companyName: String,
    location: String,
    locationType: String,
    employementType: String,
    currentlyWorkingHere: Boolean,
    startDate: String,
    startYear: Number,
    endDate: String,
    endYear: Number,
  },
  { timestamps: true },
);

module.exports = mongoose.model('Experience', experienceSchema);
