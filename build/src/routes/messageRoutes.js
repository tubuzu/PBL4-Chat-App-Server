"use strict";

var express = require("express");
var _require = require("../controllers/conversationMessageControllers"),
  getMessagesByConversationId = _require.getMessagesByConversationId,
  sendConversationMessage = _require.sendConversationMessage,
  forwardConversationMessage = _require.forwardConversationMessage,
  updateMessageById = _require.updateMessageById,
  deleteMessageById = _require.deleteMessageById;
var _require2 = require("../middleware/authMiddleware"),
  protect = _require2.protect;
var router = express.Router();
router.route("/conversations/:conversationId/messages").get(protect, getMessagesByConversationId).post(protect, sendConversationMessage);
router.route("/conversations/:conversationId/forward").post(protect, forwardConversationMessage);
router.route("/conversations/:conversationId/messages/:messageId").patch(protect, updateMessageById)["delete"](protect, deleteMessageById);
module.exports = router;