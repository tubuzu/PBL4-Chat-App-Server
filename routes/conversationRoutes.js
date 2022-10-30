const express = require("express");
const {
  createConversation,
  fetchConversations,
  fetchConversationById,
  searchConversation,
} = require("../controllers/conversationControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(protect, createConversation);
router.route("/").get(protect, fetchConversations);
router.route("/:id").get(protect, fetchConversationById);
router.route("/search").get(protect, searchConversation);
// router.route("/group").post(protect, createGroupConversation);
// router.route("/rename").put(protect, renameGroup);
// router.route("/groupremove").put(protect, removeFromGroup);
// router.route("/groupadd").put(protect, addToGroup);

module.exports = router;
