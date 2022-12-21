"use strict";

var express = require("express");
var _require = require("../controllers/groupMessageControllers"),
  getMessagesByGroupId = _require.getMessagesByGroupId,
  sendGroupMessage = _require.sendGroupMessage,
  forwardGroupMessage = _require.forwardGroupMessage,
  updateGroupMessageById = _require.updateGroupMessageById,
  deleteGroupMessageById = _require.deleteGroupMessageById;
var _require2 = require("../middleware/authMiddleware"),
  protect = _require2.protect;
var router = express.Router();
router.route("/groups/:groupId/messages").get(protect, getMessagesByGroupId).post(protect, sendGroupMessage);
router.route("/groups/:groupId/forward").post(protect, forwardGroupMessage);
router.route("/groups/:groupId/messages/:messageId").patch(protect, updateGroupMessageById)["delete"](protect, deleteGroupMessageById);
module.exports = router;