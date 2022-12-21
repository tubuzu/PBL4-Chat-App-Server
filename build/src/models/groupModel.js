"use strict";

var mongoose = require("mongoose");
var groupModel = mongoose.Schema({
  title: {
    type: String,
    trim: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "GroupMessage"
  }],
  latestMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GroupMessage"
  }
}, {
  timestamps: true
});
var Group = mongoose.model("Group", groupModel);
module.exports = Group;