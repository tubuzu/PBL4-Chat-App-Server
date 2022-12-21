const asyncHandler = require("express-async-handler");
const { NotFoundError, UnauthenticatedError } = require("../errors");
const Friend = require("../models/friendModel");
const WebSockets = require("../utils/WebSockets");

//@description     Get all friends by userId
//@route           GET /api/friends/
//@access          Protected
const fetchFriends = asyncHandler(async (req, res) => {
    const friends = await Friend.find({
        $or: [
            {
                sender: { $eq: req.user._id }
            },
            {
                receiver: { $eq: req.user._id }
            },
        ]
    }).populate('sender', '-password').populate('receiver', '-password');

    res.send(friends);
});

//@description     Delete friend
//@route           PATCH /api/friends/:friendId/delete
//@access          Protected
const removeFriend = asyncHandler(async (req, res) => {
    const friend = await Friend.findOne({ _id: req.params.friendId })
    if (!friend) throw new NotFoundError("friendId not found!");

    if (friend.sender.toString() !== req.user._id.toString() && friend.receiver.toString() !== req.user._id.toString()) throw new UnauthenticatedError("You are not authenticated to do this action!");

    const response = await Friend.findByIdAndDelete(req.params.friendId);
    const recipientSocket = WebSockets.onlineUsers.get(req.user._id.toString() === friend.sender.toString() ? friend.receiver.toString() : friend.sender.toString());
    if (recipientSocket) global.io.to(recipientSocket).emit('onFriendRemoved', friend);
    
    res.send(response);
});

module.exports = { fetchFriends, removeFriend };