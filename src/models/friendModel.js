const mongoose = require("mongoose");

const friendsModel = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Friend = mongoose.model("Friend", friendsModel);

module.exports = Friend;
