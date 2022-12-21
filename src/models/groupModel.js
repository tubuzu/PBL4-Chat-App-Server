const mongoose = require("mongoose");

const groupModel = mongoose.Schema(
    {
        title: { type: String, trim: true },
        creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "GroupMessage" }],
        latestMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GroupMessage",
        },
    },
    { timestamps: true }
);

const Group = mongoose.model("Group", groupModel);

module.exports = Group;
