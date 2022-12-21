const mongoose = require("mongoose");

const groupMessageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    attachments: [{
      url: { type: String, trim: true },
      cloudId: { type: String, trim: true }
    }],
  },
  { timestamps: true }
);

const GroupMessage = mongoose.model("GroupMessage", groupMessageSchema);
module.exports = GroupMessage;
