const mongoose = require("mongoose");

const friendRequestModel = mongoose.Schema(
    {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
            type: String,
            enum: ['accepted', 'rejected', 'pending'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

const FriendRequest = mongoose.model("FriendRequest", friendRequestModel);

module.exports = FriendRequest;
