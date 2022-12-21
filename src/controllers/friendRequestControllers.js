const asyncHandler = require("express-async-handler");
const { NotFoundError, UnauthenticatedError, BadRequestError } = require("../errors");
const Friend = require("../models/friendModel");
const FriendRequest = require("../models/friendRequest");
const User = require("../models/userModel");

//@description     Get all requests by userId
//@route           GET /api/friends/requests/
//@access          Protected
const fetchRequests = asyncHandler(async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      $or: [
        {
          sender: { $eq: req.user._id }
        },
        {
          receiver: { $eq: req.user._id }
        },
      ],
      status: 'pending',
    }).populate('sender', '-password').populate('receiver', '-password');

    res.send(requests);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create request
//@route           POST /api/friends/requests/:requestId/create
//@access          Protected
const createRequest = asyncHandler(async (req, res) => {
  const senderId = req.user._id;
  const receiverId = req.body.friendId;
  if (senderId.toString() === receiverId) throw new BadRequestError("Cannot add yourself!");

  const receiver = await User.findOne({ _id: receiverId });
  if (!receiver) throw new NotFoundError("Receiver does not exist!");

  const friendRequestExist = await FriendRequest.find({
    $or: [
      {
        sender: { $eq: senderId }, receiver: { $eq: receiverId }, status: 'pending',
      },
      {
        sender: { $eq: receiverId }, receiver: { $eq: senderId }, status: 'pending',
      },
    ]
  })
  if (friendRequestExist.length) throw new BadRequestError("Friend request is pending!");

  const friendExist = await Friend.find({
    $or: [
      {
        sender: { $eq: senderId }, receiver: { $eq: receiverId },
      },
      {
        sender: { $eq: receiverId }, receiver: { $eq: senderId },
      },
    ]
  })
  if (friendExist.length) throw new BadRequestError("Friend already existed!");

  const friendRequest = await FriendRequest.create({
    sender: senderId,
    receiver: receiverId
  });

  res.send(friendRequest);
});

//@description     Delete friend
//@route           PATCH /api/friends/requests/:requestId/accept
//@access          Protected
const acceptRequest = asyncHandler(async (req, res) => {
  try {
    const requestId = req.params.requestId;

    const friendRequest = await FriendRequest.findOne({ _id: requestId });
    if (!friendRequest) throw new NotFoundError("Request not found!");

    if (friendRequest.status === 'accepted') throw new BadRequestError("Request already accepted!");
    if (friendRequest.status === 'rejected') throw new BadRequestError("Request had been rejected!");

    const requestUpdated = await FriendRequest.findByIdAndUpdate(requestId, { status: 'accepted' }, { new: true, upsert: true });

    const friend = await Friend.create({
      sender: requestUpdated.sender,
      receiver: requestUpdated.receiver
    })

    res.send({ friendRequest: requestUpdated, friend });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Delete friend
//@route           PATCH /api/friends/requests/:requestId/reject
//@access          Protected
const rejectRequest = asyncHandler(async (req, res) => {
  try {
    const requestId = req.params.requestId;

    const friendRequest = await FriendRequest.findOne({ _id: requestId });
    if (!friendRequest) throw new NotFoundError("Request not found!");

    if (friendRequest.status === 'accepted') throw new BadRequestError("Request had been accepted!");
    if (friendRequest.status === 'rejected') throw new BadRequestError("Request had already been rejected!");

    const requestUpdated = await FriendRequest.findByIdAndUpdate(requestId, { status: 'rejected' }, { new: true, upsert: true });

    res.send(requestUpdated);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Delete friend
//@route           PATCH /api/friends/requests/:requestId/cancel
//@access          Protected
const cancelRequest = asyncHandler(async (req, res) => {
  try {
    const requestId = req.params.requestId;

    const friendRequest = await FriendRequest.findOne({ _id: requestId });
    if (!friendRequest) throw new NotFoundError("Request not found!");

    const requestDeleted = await FriendRequest.findByIdAndDelete(requestId);

    res.send(requestDeleted);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { fetchRequests, createRequest, acceptRequest, rejectRequest, cancelRequest };