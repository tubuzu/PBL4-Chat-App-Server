"use strict";

var mongoose = require("mongoose");
var friendRequestModel = mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  status: {
    type: String,
    "enum": ['accepted', 'rejected', 'pending'],
    "default": 'pending'
  }
}, {
  timestamps: true
});
var FriendRequest = mongoose.model("FriendRequest", friendRequestModel);
module.exports = FriendRequest;