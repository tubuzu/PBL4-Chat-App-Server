"use strict";

var mongoose = require("mongoose");
var conversationModel = mongoose.Schema({
  // chatName: { type: String, trim: true },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  }],
  latestMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  }
}, {
  timestamps: true
});
var Conversation = mongoose.model("Conversation", conversationModel);
module.exports = Conversation;