"use strict";

var express = require("express");
var _require = require("../controllers/groupControllers"),
  createGroup = _require.createGroup,
  fetchGroups = _require.fetchGroups,
  fetchGroupById = _require.fetchGroupById,
  addGroupRecipients = _require.addGroupRecipients,
  removeGroupRecipient = _require.removeGroupRecipient,
  updateGroupOwner = _require.updateGroupOwner,
  leaveGroup = _require.leaveGroup,
  renameGroup = _require.renameGroup,
  searchGroup = _require.searchGroup;
var _require2 = require("../middleware/authMiddleware"),
  protect = _require2.protect;
var router = express.Router();
router.route("/").get(protect, fetchGroups).post(protect, createGroup);
router.route("/search").get(protect, searchGroup);
router.route("/:id").get(protect, fetchGroupById);
router.route("/:groupId/recipients").post(protect, addGroupRecipients);
router.route("/:groupId/recipients/:userId")["delete"](protect, removeGroupRecipient);
router.route("/:groupId/leave")["delete"](protect, leaveGroup);
router.route("/:groupId/owner").patch(protect, updateGroupOwner);
router.route("/:groupId/title").patch(protect, renameGroup);
module.exports = router;