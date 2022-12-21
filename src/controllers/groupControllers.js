const asyncHandler = require("express-async-handler");
const Group = require("../models/groupModel");
const User = require("../models/userModel");
const socket = require("socket.io");
const { BadRequestError, NotFoundError, UnauthenticatedError } = require('../errors');
const { StatusCodes } = require("http-status-codes");
const WebSockets = require("../utils/WebSockets");

//@description     Get or Search all groups
//@route           GET /api/groups?search=
//@access          Protected
const searchGroup = async (req, res) => {
    const keyword = req.query.search
        ? {
            title: { $regex: req.query.search, $options: "i" },
        }
        : res.send([]);

    const groups = await Group.find(keyword).find({
        users: { $elemMatch: { $eq: req.user._id } },
    })
        .populate({ path: "users", select: "-password" }).populate("creator", "-password").populate("owner", "-password").populate("latestMessage")
        .sort({ updatedAt: -1 });
    res.send(groups);
};

//@description     Create or fetch One to One Conversation
//@route           POST /api/conversation/
//@access          Protected
const createGroup = asyncHandler(async (req, res) => {
    const { users, title } = req.body;

    if (!users) {
        console.log("Users param not sent with request");
        throw new BadRequestError('Users param not sent with request');
    }

    users.push(req.user._id.toString())

    var groupData = {
        title: title,
        creator: req.user._id.toString(),
        owner: req.user._id.toString(),
        users: users,
    };

    const createdGroup = await Group.create(groupData);
    const FullGroup = await Group.findOne({ _id: createdGroup._id }).populate({ path: "users", select: "-password" }).populate("creator", "-password").populate("owner", "-password");

    FullGroup.users.forEach((user) => {
        const isUserOnline = WebSockets.onlineUsers.get(user._id.toString());
        isUserOnline && global.io.to(isUserOnline).emit('onGroupCreate', FullGroup);
    });

    res.status(StatusCodes.CREATED).json(FullGroup);
});

//@description     Fetch all Conversations for a user
//@route           GET /api/conversations/
//@access          Protected
const fetchGroups = asyncHandler(async (req, res) => {
    const groups = await Group.find({ users: { $elemMatch: { $eq: req.user._id } } })
        .populate({ path: "users", select: "-password" }).populate("creator", "-password").populate("owner", "-password").populate("latestMessage")
        .sort({ updatedAt: -1 })
    res.status(StatusCodes.OK).send(groups);
});

//@description     Fetch all Conversations for a user
//@route           GET /api/conversations/
//@access          Protected
const fetchGroupById = asyncHandler(async (req, res) => {
    const group = await Group.findOne({ $and: [{ users: { $elemMatch: { $eq: req.user._id } } }, { _id: req.params.id }] })
        .populate({ path: "users", select: "-password" }).populate("creator", "-password").populate("owner", "-password").populate("latestMessage")
    if (group.length < 1) throw new NotFoundError("The user is not found or you are not in this group.");
    res.status(StatusCodes.OK).send(group);
});

//@description     Add new user to group
//@route           POST /api/groups/:groupId/recipients
//@access          Protected
const addGroupRecipients = asyncHandler(async (req, res) => {
    const groupId = req.params.groupId;
    const recipients = req.body.recipients;

    const group = await Group.findOne({ _id: groupId })
    if (!group._id) throw new NotFoundError("Group not found!");

    // if (group.owner.toString() !== req.user._id.toString())
    //     throw new UnauthenticatedError("You are not authenticated to do this action!");

    recipients.map((user) => {
        if (group.users.includes(user)) throw new BadRequestError("Recipient already in group!");
    })
    // const newMem = await User.findOne({ _id: userId });
    // if (!newMem._id) throw new NotFoundError("User not found!");
    // if (group.users.includes(newMem._id.toString())) throw new BadRequestError("Recipient already in group!");

    const groupResponse = await Group.findByIdAndUpdate(groupId, { $push: { users: { $each: recipients } } }, { new: true })
        .populate({ path: "users", select: "-password" })
        .populate("creator", "-password")
        .populate("owner", "-password")
        .populate("latestMessage");
    // res.status(StatusCodes.OK).send({});

    global.io.to(`group-${groupId}`).emit("onGroupReceivedNewUser", groupResponse);

    recipients.map((recipient) => {
        const recipientSocket = WebSockets.onlineUsers.get(recipient);
        recipientSocket && global.io.to(recipientSocket).emit('onGroupUserAdd', groupResponse);
    })

    res.status(StatusCodes.OK).send(groupResponse);
});

//@description     Remove user from group
//@route           DELETE /api/groups/:groupId/recipients/:userId
//@access          Protected
const removeGroupRecipient = asyncHandler(async (req, res) => {
    const groupId = req.params.groupId;
    const userId = req.params.userId;
    console.log('remove users')

    const group = await Group.findOne({ _id: groupId })
    if (!group._id) throw new NotFoundError("Group not found!");

    if (group.owner.toString() !== req.user._id.toString())
        throw new UnauthenticatedError("You are not authenticated to do this action!");

    if (!group.users.includes(userId)) throw new BadRequestError("Recipient is not a member of this group!");

    const groupResponse = await Group.findByIdAndUpdate(groupId, { $pull: { users: userId } }, { new: true })
        .populate({ path: "users", select: "-password" })
        .populate("creator", "-password")
        .populate("owner", "-password")
        .populate("latestMessage");
    // res.status(StatusCodes.OK).send({});

    const room_name = `group-${groupId}`

    const recipientSocket = WebSockets.onlineUsers.get(userId);
    global.io.to(room_name).emit("onGroupRecipientRemoved", groupResponse);
    if (recipientSocket) {
        global.io.to(recipientSocket).emit('onGroupRemoved', groupResponse);
        // console.log(global.io.sockets.adapter.rooms.get(room_name))
        // global.io.to(recipientSocket).leave(room_name);
    }

    res.status(StatusCodes.OK).send(groupResponse);
});

//@description     User leave group
//@route           DELETE /api/groups/:groupId/recipients/leave
//@access          Protected
const leaveGroup = asyncHandler(async (req, res) => {
    const groupId = req.params.groupId;
    const userId = req.user._id;
    console.log('leave group')

    const group = await Group.findOne({ _id: groupId })
    if (!group._id) throw new NotFoundError("Group not found!");

    if (!group.users.includes(userId)) throw new BadRequestError("Recipient is not a member of this group!");

    const groupResponse = await Group.findByIdAndUpdate(groupId, { $pull: { users: userId } }, { new: true })
        .populate({ path: "users", select: "-password" })
        .populate("creator", "-password")
        .populate("owner", "-password")
        .populate("latestMessage");
    // res.status(StatusCodes.OK).send({msg: 'You have left group!'});

    const ROOM_NAME = `group-${groupId}`;
    const socketsInRoom = global.io.sockets.adapter.rooms.get(ROOM_NAME);
    const leftUserSocket = WebSockets.onlineUsers.get(userId.toString());
    console.log(socketsInRoom, leftUserSocket, userId, WebSockets.onlineUsers);

    if (leftUserSocket && socketsInRoom) {
        console.log('user is online, at least 1 person is in the room');
        if (socketsInRoom.has(leftUserSocket)) {
            console.log('User is in room... room set has socket id');
            return global.io.to(ROOM_NAME).emit('onGroupParticipantLeft', { userId: userId, group: groupResponse })
        } else {
            console.log('User is not in room, but someone is there');
            global.io.to(leftUserSocket).emit('onGroupParticipantLeft', { userId: userId, group: groupResponse });
            global.io.to(ROOM_NAME).emit('onGroupParticipantLeft', { userId: userId, group: groupResponse });
            return;
        }
    }
    if (leftUserSocket && !socketsInRoom) {
        console.log('User is online but there are no sockets in the room');
        return global.io.to(leftUserSocket).emit('onGroupParticipantLeft', { userId: userId, group: groupResponse });
    }

    res.status(StatusCodes.OK).send(groupResponse._id);
});

//@description     Update group owner
//@route           DELETE /api/groups/:groupId/owner
//@access          Protected
const updateGroupOwner = asyncHandler(async (req, res) => {
    const groupId = req.params.groupId;
    const ownerId = req.body.newOwnerId;
    console.log(groupId, ownerId)

    const group = await Group.findOne({ _id: groupId })
    if (!group._id) throw new NotFoundError("Group not found!");

    if (group.owner.toString() !== req.user._id.toString())
        throw new UnauthenticatedError("You are not authenticated to do this action!");

    if (!group.users.includes(ownerId)) throw new BadRequestError("Recipient is not a member of this group!");

    const groupResponse = await Group.findByIdAndUpdate(groupId, { owner: ownerId }, { new: true })
        .populate({ path: "users", select: "-password" })
        .populate("creator", "-password")
        .populate("owner", "-password")
        .populate("latestMessage");

    const ROOM_NAME = `group-${groupId}`;
    const newOwnerSocket = WebSockets.onlineUsers.get(ownerId);
    const newOwnerRooms = global.io.to(newOwnerSocket).rooms;
    console.log('Sockets In Room');
    console.log(newOwnerRooms);
    console.log(newOwnerSocket);
    global.io.to(ROOM_NAME).emit('onGroupOwnerUpdate', groupResponse);
    if (newOwnerSocket && !newOwnerRooms.has(ROOM_NAME)) {
        console.log('The new owner is not in the room...');
        global.io.to(newOwnerSocket).emit('onGroupOwnerUpdate', groupResponse);
    }

    res.status(StatusCodes.OK).send(groupResponse);
});

//@description     Update group title
//@route           DELETE /api/groups/:groupId/title
//@access          Protected
const renameGroup = asyncHandler(async (req, res) => {
    const groupId = req.params.groupId;
    const newTitle = req.body.newTitle;
    console.log(groupId, newTitle)

    const group = await Group.findOne({ _id: groupId })
    if (!group._id) throw new NotFoundError("Group not found!");

    if (group.owner.toString() !== req.user._id.toString())
        throw new UnauthenticatedError("You are not authenticated to do this action!");

    const groupResponse = await Group.findByIdAndUpdate(groupId, { title: newTitle }, { new: true })
        .populate({ path: "users", select: "-password" })
        .populate("creator", "-password")
        .populate("owner", "-password")
        .populate("latestMessage");

    // const ROOM_NAME = `group-${groupId}`;
    // const newOwnerSocket = WebSockets.onlineUsers.get(ownerId);
    // const newOwnerRooms = global.io.to(newOwnerSocket).rooms;
    // console.log('Sockets In Room');
    // console.log(newOwnerRooms);
    // console.log(newOwnerSocket);
    // global.io.to(ROOM_NAME).emit('onGroupOwnerUpdate', groupResponse);
    // if (newOwnerSocket && !newOwnerRooms.has(ROOM_NAME)) {
    //     console.log('The new owner is not in the room...');
    //     global.io.to(newOwnerSocket).emit('onGroupOwnerUpdate', groupResponse);
    // }

    res.status(StatusCodes.OK).send(groupResponse);
});

module.exports = {
    createGroup,
    fetchGroups,
    fetchGroupById,
    addGroupRecipients,
    removeGroupRecipient,
    leaveGroup,
    updateGroupOwner,
    renameGroup,
    searchGroup,
};
