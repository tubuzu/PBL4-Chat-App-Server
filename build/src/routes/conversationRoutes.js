"use strict";

var express = require("express");
var _require = require("../controllers/conversationControllers"),
  createConversation = _require.createConversation,
  fetchConversations = _require.fetchConversations,
  fetchConversationById = _require.fetchConversationById,
  searchConversation = _require.searchConversation;
var _require2 = require("../middleware/authMiddleware"),
  protect = _require2.protect;
var router = express.Router();
router.route("/").post(protect, createConversation);
router.route("/").get(protect, fetchConversations);
router.route("/:id").get(protect, fetchConversationById);
router.route("/search").get(protect, searchConversation);
// router.route("/group").post(protect, createGroupConversation);
// router.route("/rename").put(protect, renameGroup);
// router.route("/groupremove").put(protect, removeFromGroup);
// router.route("/groupadd").put(protect, addToGroup);

module.exports = router;