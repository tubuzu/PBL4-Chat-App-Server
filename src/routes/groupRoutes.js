const express = require("express");
const {
  createGroup,
  fetchGroups,
  fetchGroupById,
  addGroupRecipients,
  removeGroupRecipient,
  updateGroupOwner,
  leaveGroup,
  renameGroup,
  searchGroup,
} = require("../controllers/groupControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, fetchGroups).post(protect, createGroup);
router.route("/search").get(protect, searchGroup);
router.route("/:id").get(protect, fetchGroupById);
router.route("/:groupId/recipients").post(protect, addGroupRecipients);
router.route("/:groupId/recipients/:userId").delete(protect, removeGroupRecipient);
router.route("/:groupId/leave").delete(protect, leaveGroup);
router.route("/:groupId/owner").patch(protect, updateGroupOwner);
router.route("/:groupId/title").patch(protect, renameGroup);

module.exports = router;