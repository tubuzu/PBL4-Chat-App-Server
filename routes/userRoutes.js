const express = require("express");
const {
  registerUser,
  authUser,
  searchUser,
  authJWT,
  updateProfile,
  updateStatusMessage,
} = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, searchUser);
router.route("/").post(registerUser);
router.post("/login", authUser);
router.route("/authJWT").get(protect, authJWT);
router.route("/profile").patch(protect, updateProfile);
router.route("/status").patch(protect, updateStatusMessage);

module.exports = router;
