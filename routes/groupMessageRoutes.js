const express = require("express");
const {
  getMessagesByGroupId,
  sendGroupMessage,
  forwardGroupMessage,
  updateGroupMessageById,
  deleteGroupMessageById,
} = require("../controllers/groupMessageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/groups/:groupId/messages").get(protect, getMessagesByGroupId).post(protect, sendGroupMessage);
router.route("/groups/:groupId/forward").post(protect, forwardGroupMessage);
router.route("/groups/:groupId/messages/:messageId").patch(protect, updateGroupMessageById).delete(protect, deleteGroupMessageById);


module.exports = router;
