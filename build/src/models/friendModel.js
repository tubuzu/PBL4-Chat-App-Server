"use strict";

var mongoose = require("mongoose");
var friendsModel = mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, {
  timestamps: true
});
var Friend = mongoose.model("Friend", friendsModel);
module.exports = Friend;