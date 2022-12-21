"use strict";

var mongoose = require("mongoose");
var messageSchema = mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  content: {
    type: String,
    trim: true
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation"
  },
  attachments: [{
    url: {
      type: String,
      trim: true
    },
    cloudId: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true
});
var Message = mongoose.model("Message", messageSchema);
module.exports = Message;