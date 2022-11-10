const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const Conversation = require("../models/conversationModel");
const { BadRequestError, NotFoundError } = require("../errors");
const { StatusCodes } = require("http-status-codes");
const WebSockets = require("../utils/WebSockets");
const cloudinary = require("../utils/cloudinary");

//@description     Get all Conversation Messages
//@route           GET /api/conversations/:conversationId/messages
//@access          Protected
const getMessagesByConversationId = asyncHandler(async (req, res) => {
  try {
    const conversation = await Conversation.find({ _id: req.params.conversationId })
    if (!conversation[0]) throw new NotFoundError('Conversation is not found!');

    const { messages } = await Conversation.findOne({ _id: conversation[0]._id })
      .populate({
        path: 'messages',
        populate: { path: 'sender', select: "_id avatar username firstname lastname email" },
        options: { sort: { createdAt: -1 } }
      })
    // .populate("conversation")

    res.json({ _id: conversation[0]._id, messages: messages });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendConversationMessage = asyncHandler(async (req, res) => {
  const { content, id } = req.body;

  if ((!content && !req.files.attachments) || !id) {
    throw new BadRequestError("Invalid data passed into request");
  }

  const conversationExist = Conversation.findOne({ _id: id });
  if (!conversationExist) throw new NotFoundError('Conversation not found!');

  let attachments = [];
  if(req.files.attachments) {
    attachments = await Promise.all(req.files.attachments.map(async (file) => {
      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(file.path);
      console.log(result);
      return {
        url: result.secure_url,
        cloudId: result.public_id,
      };
    }))
  }

  try {
    var message = await Message.create({
      sender: req.user._id,
      content: content,
      attachments: attachments,
      conversation: id,
    });

    const conversation = await Conversation.findByIdAndUpdate(id, { $push: { messages: message._id }, latestMessage: message }, { new: true, upsert: true })
      .populate("creator", "-password")
      .populate("recipient", "-password");

    const messagePayload = await Message.findOne({ _id: message._id }).populate("sender", "_id avatar username firstname lastname email");

    const recipient = conversation.creator._id.toString() === req.user._id.toString() ? conversation.recipient._id.toString() : conversation.creator._id.toString();
    const recipientSocket = WebSockets.onlineUsers.get(recipient);
    if (recipientSocket) {
      global.io.to(recipientSocket).emit("onMessage", { message: messagePayload, conversation: conversation });
    }
    // eventEmitter.emit('message.create', conversation, messagePayload);
    global.io.to(WebSockets.onlineUsers.get(req.user._id.toString())).emit('onMessage', { message: messagePayload, conversation: conversation });

    console.log('send');
    res.status(StatusCodes.CREATED).json(messagePayload);
  } catch (error) {
    throw new BadRequestError(error.message);
  }
});

//@description     Forward Message
//@route           POST /api/Message/forward
//@access          Protected
const forwardConversationMessage = asyncHandler(async (req, res) => {
  const { messageBody } = req.body;
  const { conversationId } = req.params;

  if ((!messageBody.content && !messageBody.attachments.length) || !conversationId) {
    throw new BadRequestError("Invalid data passed into request");
  }

  // const conversationExist = Conversation.findOne({ _id: conversationId });
  // if (!conversationExist) throw new NotFoundError('Conversation not found!');

  try {
    var message = await Message.create({
      sender: req.user._id,
      content: messageBody.content,
      attachments: messageBody.attachments,
      conversation: conversationId,
    });

    const conversation = await Conversation.findByIdAndUpdate(conversationId, { $push: { messages: message._id }, latestMessage: message }, { new: true, upsert: true })
      .populate("creator", "-password")
      .populate("recipient", "-password");

    const messagePayload = await Message.findOne({ _id: message._id }).populate("sender", "_id avatar username firstname lastname email");

    const recipient = conversation.creator._id.toString() === req.user._id.toString() ? conversation.recipient._id.toString() : conversation.creator._id.toString();
    const recipientSocket = WebSockets.onlineUsers.get(recipient);
    if (recipientSocket) {
      global.io.to(recipientSocket).emit("onMessage", { message: messagePayload, conversation: conversation });
    }
    global.io.to(WebSockets.onlineUsers.get(req.user._id.toString())).emit('onMessage', { message: messagePayload, conversation: conversation });

    res.status(StatusCodes.CREATED).json(messagePayload);
  } catch (error) {
    throw new BadRequestError(error.message);
  }
});

//@description     Update message content
//@route           PATCH /api/conversations/:conversationId/messages/:messageId
//@access          Protected
const updateMessageById = asyncHandler(async (req, res) => {
  try {
    const { sender } = await Message.findOne({ _id: req.params.messageId }).select('sender');
    if (req.user._id.toString() !== sender.toString()) throw new UnauthenticatedError('You are not authenticated to make changes of this message!');

    const message = await Message.findByIdAndUpdate(req.params.messageId, { content: req.body.content }, { new: true }).populate("sender", "_id avatar username firstname lastname email").populate("conversation");

    const { recipient } = await Conversation.findOne({ _id: req.params.conversationId });
    if (!recipient) throw new NotFoundError('ConversationId not found!');
    WebSockets.onlineUsers.has(recipient.toString()) && global.io.to(WebSockets.onlineUsers.get(recipient.toString())).emit("onMessageUpdate", message);

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Update message content
//@route           PATCH /api/conversations/:conversationId/messages/:messageId
//@access          Protected
const deleteMessageById = asyncHandler(async (req, res) => {
  try {
    const { sender } = await Message.findOne({ _id: req.params.messageId }).select('sender');
    if (req.user._id.toString() !== sender.toString()) throw new UnauthenticatedError('You are not authenticated to make changes of this message!');

    const message = await Message.findByIdAndDelete(req.params.messageId);
    await Conversation.findOneAndUpdate({ _id: req.params.conversationId }, { $pull: { messages: req.params.messageId } });

    message.attachments.length && message.attachments.map(async (file) => {
      await cloudinary.uploader.destroy(file.cloudId);
    });

    const { messages, latestMessage } = await Conversation.findOne({ _id: req.params.conversationId }).select('messages latestMessage');
    if (latestMessage.toString() === message._id.toString())
      await Conversation.findOneAndUpdate({ _id: req.params.conversationId }, { latestMessage: messages[messages.length - 1] })

    const { _id, recipient } = await Conversation.findOne({ _id: req.params.conversationId });
    WebSockets.onlineUsers.has(recipient.toString()) && global.io.to(WebSockets.onlineUsers.get(recipient.toString())).emit("onMessageDelete", { conversationId: req.params.conversationId, messageId: message._id });

    res.json({ conversationId: _id, messageId: message._id });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { getMessagesByConversationId, sendConversationMessage, forwardConversationMessage, updateMessageById, deleteMessageById };
