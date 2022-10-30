const Friend = require("../models/friendModel");
const Group = require("../models/groupModel");

class WebSockets {
  static onlineUsers = new Map();
  static getOnlineUsers = () => WebSockets.onlineUsers;
  connection(socket) {
    let tempId = '';
    // event fired when the chat room is disconnected
    socket.on("disconnect", () => {
      console.log(`user ${tempId} disconnect`);
      WebSockets.onlineUsers.delete(tempId);
      tempId = '';
    });
    // add identity of user mapped to the socket id
    socket.on("identity", (userId) => {
      // const newUser = { socketId: socket.id, userId: userId };
      WebSockets.onlineUsers.set(userId, socket.id);
      tempId = userId;
      console.log(`user ${userId} connect`);
    });
    // onConversationJoin
    socket.on("onConversationJoin", ({ conversationId }) => {
      // console.log(
      //   `${tempId} joined a Conversation of ID: ${conversationId}`,
      // );
      socket.join(`conversation-${conversationId}`);
      // console.log(socket.rooms);
      global.io.to(`conversation-${conversationId}`).emit('userJoin');
    })
    // onConversationLeave
    socket.on("onConversationLeave", ({ conversationId }) => {
      // console.log('onConversationLeave');
      socket.leave(`conversation-${conversationId}`);
      // console.log(socket.rooms);
      global.io.to(`conversation-${conversationId}`).emit('userLeave');
    })
    // onGroupJoin
    socket.on("onGroupJoin", ({ groupId }) => {
      // console.log(
      //   `${tempId} joined a Group of ID: ${groupId}`,
      // );
      socket.join(`group-${groupId}`);
      // console.log(socket.rooms);
      global.io.to(`group-${groupId}`).emit('userGroupJoin');
    })
    // onGroupLeave
    socket.on("onGroupLeave", ({ groupId }) => {
      // console.log('onGroupLeave');
      socket.leave(`group-${groupId}`);
      // console.log(socket.rooms);
      global.io.to(`group-${groupId}`).emit('userGroupLeave');
    })

    // onTypingStart
    socket.on("onTypingStart", ({ conversationId }) => {
      console.log('onTypingStart');
      console.log(conversationId, socket.rooms);
      socket.to(`conversation-${conversationId}`).emit('onTypingStart');
    })

    // onTypingStop
    socket.on("onTypingStop", ({ conversationId }) => {
      console.log('onTypingStop');
      console.log(conversationId, socket.rooms);
      socket.to(`conversation-${conversationId}`).emit('onTypingStop');
    })

    //
    socket.on("getOnlineGroupUsers", async ({ groupId }) => {
      const group = await Group.findById(groupId).populate({ path: "users", select: "-password" });
      if (!group) return;
      const onlineUsers = [];
      const offlineUsers = [];
      group.users.forEach((user) => {
        const socket = WebSockets.onlineUsers.get(user._id.toString());
        socket ? onlineUsers.push(user) : offlineUsers.push(user);
      });
      socket.emit('onlineGroupUsersReceived', { onlineUsers, offlineUsers });
    })

    //getOnlineFriends
    socket.on("getOnlineFriends", async ({ userId }) => {
      const friends = await Friend.find({
        $or: [
          {
            sender: { $eq: userId }
          },
          {
            receiver: { $eq: userId }
          },
        ]
      }).populate('sender', '-password').populate('receiver', '-password');
      const onlineFriends = [];
      if (!friends.length) {
        socket.emit('getOnlineFriends', onlineFriends); 
        return;
      }
      friends.forEach((friend) => {
        const recipient = friend.sender._id.toString() === userId ? friend.receiver._id : friend.sender._id;
        const socket = WebSockets.onlineUsers.get(recipient.toString());
        if (socket) onlineFriends.push(friend)
      });
      socket.emit('getOnlineFriends', onlineFriends);
    })

    //onMessage
    // global.eventEmitter.on('message.create', (conv, mess) => {
    //   console.log('message.create');
    //   global.io.to(socket.id).emit('onMessage', { message: mess, conversation: conv });
    // })

    //onGroupMessage
    // global.eventEmitter.on('group.message.create', (group, mess) => {
    //   socket.emit('onGroupMessage', { message: mess, group: group });
    // })

    //conversation.create
    // global.eventEmitter.on('conversation.create', (conversation) => {
    //   console.log("conv.create", conversation, WebSockets.onlineUsers.get(conversation.recipient._id.toString()))
    //   global.io.to(WebSockets.onlineUsers.get(conversation.recipient._id.toString())).emit('onConversation', conversation);
    // })

  }

  static getByValue(searchValue) {
    for (let [key, value] of WebSockets.onlineUsers.entries()) {
      if (value === searchValue)
        return key;
    }
  }
}

module.exports = WebSockets;