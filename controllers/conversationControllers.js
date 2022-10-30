// const asyncHandler = require("express-async-handler");
const Conversation = require("../models/conversationModel");
const User = require("../models/userModel");
const { BadRequestError, NotFoundError } = require('../errors');
const { StatusCodes } = require("http-status-codes");
const WebSockets = require("../utils/WebSockets");

//@description     Get or Search all conversations
//@route           GET /api/conversations?search=
//@access          Protected
const searchConversation = async (req, res) => {
    const keyword = req.query.search
        ? {
            title: { $regex: req.query.search, $options: "i" },
        }
        : res.send([]);

    const convs = await Conversation.find(keyword).find({
        $or: [
            { recipient: { $eq: req.user._id } },
            { creator: { $eq: req.user._id } },
        ],
    })
        .populate("creator", "-password")
        .populate("recipient", "-password")
        .populate("latestMessage")
        .sort({ updatedAt: -1 });
    res.send(convs);
};

//@description     Create or fetch One to One Conversation
//@route           POST /api/conversation/
//@access          Protected
const createConversation = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        console.log("UserId param not sent with request");
        throw new BadRequestError('UserId param not sent with request');
    }

    var userExist = await User.find({ _id: { $eq: userId } });

    if (!userExist.length) {
        console.log("UserId does not exist!");
        throw new NotFoundError(`The user with id ${userId} does not exist!`);
    }

    var isConversation = await Conversation.find({
        $or: [{
            $and: [
                { creator: { $eq: req.user._id } },
                { recipient: { $eq: userId } },
            ],
        }, {
            $and: [
                { creator: { $eq: userId } },
                { recipient: { $eq: req.user._id } },
            ],
        }]
    });

    if (isConversation.length) {
        res.status(StatusCodes.OK).json(isConversation[0]);
        // throw new BadRequestError('Conversation exists!');
    } else {
        var conversationData = {
            creator: req.user._id,
            recipient: userId,
        };

        const createdConversation = await Conversation.create(conversationData);
        const FullConversation = await Conversation.findOne({ _id: createdConversation._id }).populate(
            "creator",
            "-password"
        ).populate(
            "recipient",
            "-password"
        );
        const recipientSocket = WebSockets.onlineUsers.get(FullConversation.recipient._id.toString());
        if (recipientSocket)
            global.io.to(recipientSocket).emit('onConversation', FullConversation);
        res.status(StatusCodes.CREATED).json(FullConversation);
    }
};

//@description     Fetch all Conversations for a user
//@route           GET /api/conversations/
//@access          Protected
const fetchConversations = async (req, res) => {
    const conversations = await Conversation.find({ $or: [{ creator: { $eq: req.user._id } }, { recipient: { $eq: req.user._id } }] })
        .populate("creator", "-password")
        .populate("recipient", "-password")
        .populate("latestMessage")
        .sort({ updatedAt: -1 })
    // .then(async (results) => {
    //     results = await User.populate(results, {
    //         path: "latestMessage.sender",
    //         select: "name avatar email",
    //     });
    //     res.status(200).send(results);
    // });
    res.status(StatusCodes.OK).send(conversations);

};

//@description     Fetch all Conversations for a user
//@route           GET /api/conversations/
//@access          Protected
const fetchConversationById = async (req, res) => {
    const conversation = await Conversation.find({ $and: [{ $or: [{ creator: { $eq: req.user._id } }, { recipient: { $eq: req.user._id } }] }, { _id: req.params.id }] })
        .populate("creator", "-password")
        .populate("recipient", "-password")
        .populate("latestMessage")
    if (conversation.length < 1) throw new NotFoundError("The user is not found or you are not in conversation with this user.");
    res.status(StatusCodes.OK).send(conversation);
}




// const renameGroup = asyncHandler(async (req, res) => {
//     const { conversationId, conversationName } = req.body;

//     const updatedConversation = await Conversation.findByIdAndUpdate(
//         conversationId,
//         {
//             conversationName: conversationName,
//         },
//         {
//             new: true,
//         }
//     )
//         .populate("users", "-password")
//         .populate("groupAdmin", "-password");

//     if (!updatedConversation) {
//         res.status(404);
//         throw new Error("Conversation Not Found");
//     } else {
//         res.json(updatedConversation);
//     }
// });


module.exports = {
    createConversation,
    fetchConversations,
    fetchConversationById,
    searchConversation,
};
