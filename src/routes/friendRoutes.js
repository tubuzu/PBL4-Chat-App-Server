const express = require("express");
const {
  fetchFriends,
  removeFriend,
} = require("../controllers/friendControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, fetchFriends);
router.route("/:friendId/delete").delete(protect, removeFriend);

module.exports = router;
