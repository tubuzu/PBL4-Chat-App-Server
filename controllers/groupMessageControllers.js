const asyncHandler = require("express-async-handler");
const GroupMessage = require("../models/groupMessageModel");
// const User = require("../models/userModel");
const Group = require("../models/groupModel");
const { BadRequestError, UnauthenticatedError, NotFoundError } = require("../errors");
const { StatusCodes } = require("http-status-codes");
const WebSockets = require("../utils/WebSockets");
const cloudinary = require("../utils/cloudinary");

//@description     Get all Group Messages
//@route           GET /api/group/:groupId/messages
//@access          Protected
const getMessagesByGroupId = asyncHandler(async (req, res) => {
  try {
    const group = await Group.find({ _id: req.params.groupId })
    if (!group[0]) throw new NotFoundError('Conversation is not found!');

    const { messages } = await Group.findOne({ _id: group[0]._id })
      .populate({
        path: 'messages',
        populate: { path: 'sender', select: "_id avatar username firstname lastname email" },
        options: { sort: { createdAt: -1 } }
      })
    // .populate("group");

    res.json({ _id: group[0]._id, messages: messages });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendGroupMessage = asyncHandler(async (req, res) => {
  const { content, id } = req.body;

  if ((!content && !req.files.length) || !id) {
    throw new BadRequestError("Invalid data passed into request");
  }

  const groupExist = Group.findOne({ _id: id });
  if (!groupExist) throw new NotFoundError('Group not found!');

  const attachments = await Promise.all(req.files.map(async (file) => {
    // Upload image to cloudinary
    const result = await cloudinary.uploader.upload(file.path);
    console.log(result);
    return {
      url: result.secure_url,
      cloudId: result.public_id,
    };
  }))

  try {
    var message = await GroupMessage.create({
      sender: req.user._id,
      content: content,
      attachments: attachments,
      group: id,
    });

    const group = await Group.findByIdAndUpdate(id, { $push: { messages: message._id }, latestMessage: message }, { new: true }).populate({ path: "users", select: "-password" }).populate("creator", "-password").populate("owner", "-password");

    const messagePayload = await GroupMessage.findOne({ _id: message._id }).populate("sender", "_id avatar username firstname lastname email");

    global.io.to(`group-${group._id}`).emit('onGroupMessage', { message: messagePayload, group: group });

    res.status(StatusCodes.CREATED).json(messagePayload);
  } catch (error) {
    throw new BadRequestError(error.message);
  }
});

//@description     Forward Message
//@route           POST /api/Message/forward
//@access          Protected
const forwardGroupMessage = asyncHandler(async (req, res) => {
  const { messageBody } = req.body;
  const { groupId } = req.params;

  if ((!messageBody.content && !messageBody.attachments.length) || !groupId) {
    throw new BadRequestError("Invalid data passed into request");
  }

  // const groupExist = Group.findOne({ _id: id });
  // if (!groupExist) throw new NotFoundError('Group not found!');

  try {
    var message = await GroupMessage.create({
      sender: req.user._id,
      content: messageBody.content,
      attachments: messageBody.attachments,
      group: groupId,
    });

    const group = await Group.findByIdAndUpdate(groupId, { $push: { messages: message._id }, latestMessage: message }, { new: true }).populate({ path: "users", select: "-password" }).populate("creator", "-password").populate("owner", "-password");

    const messagePayload = await GroupMessage.findOne({ _id: message._id }).populate("sender", "_id avatar username firstname lastname email");

    global.io.to(`group-${group._id}`).emit('onGroupMessage', { message: messagePayload, group: group });

    res.status(StatusCodes.CREATED).json(messagePayload);
  } catch (error) {
    throw new BadRequestError(error.message);
  }
});

//@description     Update message content
//@route           PATCH /api/group/:groupId/messages/:messageId
//@access          Protected
const updateGroupMessageById = asyncHandler(async (req, res) => {
  try {
    const { sender } = await GroupMessage.findOne({ _id: req.params.messageId }).select('sender');
    if (req.user._id.toString() !== sender.toString()) throw new UnauthenticatedError('You are not authenticated to make changes of this message!');

    const message = await GroupMessage.findByIdAndUpdate(req.params.messageId, { content: req.body.content }, { new: true }).populate("sender", "_id avatar username firstname lastname email").populate("group");

    const { users } = await Group.findOne({ _id: req.params.groupId });
    if (!users) throw new NotFoundError('GroupId not found!');
    users.map((user) => {
      if (user.toString() !== message.sender._id.toString() && WebSockets.onlineUsers.has(user.toString()))
        global.io.to(WebSockets.onlineUsers.get(user.toString())).emit("onGroupMessageUpdate", message);
    })

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Update message content
//@route           PATCH /api/groups/:groupId/messages/:messageId
//@access          Protected
const deleteGroupMessageById = asyncHandler(async (req, res) => {
  try {
    const { sender } = await GroupMessage.findOne({ _id: req.params.messageId }).select('sender');
    if (req.user._id.toString() !== sender.toString()) throw new UnauthenticatedError('You are not authenticated to make changes of this message!');

    const message = await GroupMessage.findByIdAndDelete(req.params.messageId);
    await Group.findOneAndUpdate({ _id: req.params.groupId }, { $pull: { messages: req.params.messageId } });

    const { messages, latestMessage } = await Group.findOne({ _id: req.params.groupId }).select('messages latestMessage');
    if (latestMessage.toString() === message._id.toString())
      await Group.findOneAndUpdate({ _id: req.params.groupId }, { latestMessage: messages[messages.length - 1] })

    const { _id, users } = await Group.findOne({ _id: req.params.groupId });
    users.map((user) => {
      if (user.toString() !== message.sender.toString() && WebSockets.onlineUsers.has(user.toString()))
        global.io.to(WebSockets.onlineUsers.get(user.toString())).emit("onGroupMessageDelete", { groupId: _id, messageId: message._id });
    })

    message.attachments.length && message.attachments.map(async (file) => {
      await cloudinary.uploader.destroy(file.cloudId);
    });

    res.json({ groupId: req.params.groupId, messageId: message._id });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { getMessagesByGroupId, sendGroupMessage, forwardGroupMessage, updateGroupMessageById, deleteGroupMessageById };
