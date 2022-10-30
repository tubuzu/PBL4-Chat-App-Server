const express = require("express");
const {
  getMessagesByConversationId,
  sendConversationMessage,
  forwardConversationMessage,
  updateMessageById,
  deleteMessageById,
} = require("../controllers/conversationMessageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/conversations/:conversationId/messages").get(protect, getMessagesByConversationId).post(protect, sendConversationMessage);
router.route("/conversations/:conversationId/forward").post(protect, forwardConversationMessage);
router.route("/conversations/:conversationId/messages/:messageId").patch(protect, updateMessageById).delete(protect, deleteMessageById);

module.exports = router;
