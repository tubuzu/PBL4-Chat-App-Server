const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");
const { BadRequestError } = require("../errors");
const { StatusCodes } = require("http-status-codes");
const cloudinary = require("../utils/cloudinary");
const bcrypt = require("bcryptjs");

//@description     Get or Search all users
//@route           GET /api/user?search=
//@access          Public
const searchUser = async (req, res) => {
  const keyword = req.query.search
    ? {
      $or: [
        { username: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ],
    }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } }).select('_id username firstname lastname email avatar background about statusMessage');
  res.send(users);
};

//@description     Register new user
//@route           POST /api/user/
//@access          Public
const registerUser = async (req, res) => {
  const { username, firstname, lastname, email, password } = req.body;

  if (!username || !email || !password || !firstname || !lastname) {
    throw new BadRequestError("Please Enter all the Fields");
  }

  const usernameExists = await User.findOne({ username });

  if (usernameExists) {
    throw new BadRequestError("Username already exists");
  }

  const emailExists = await User.findOne({ email });

  if (emailExists) {
    throw new BadRequestError("Email already exists");
  }

  const user = await User.create({
    username,
    firstname,
    lastname,
    email,
    password,
  });

  if (!user) {
    throw new BadRequestError("Something went wrong!");
  }

  res.status(StatusCodes.CREATED).json({
    userData: {
      _id: user._id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      about: user.about,
      avatar: user.avatar,
      background: user.background,
      statusMessage: user.statusMessage,
    },
    token: generateToken(user._id),
  });
};

//@description     Auth the user
//@route           POST /api/users/login
//@access          Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    throw new BadRequestError("Invalid Email or Password");
  }

  res.json({
    userData: {
      _id: user._id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      about: user.about,
      avatar: user.avatar,
      background: user.background,
      statusMessage: user.statusMessage,
    },
    token: generateToken(user._id),
  });
};

const authJWT = async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  return res.json({ userData: req.user, token: token });
};

//@description     Get or Search all users
//@route           GET /api/user/profile/:id
//@access          Public
const getUserProfile = async (req, res) => {
  const users = await User.findOne({ _id: req.params.id }).select('_id username avatar background about');
  res.send(users);
};

//@description     Update profile
//@route           PATCH /api/user/profile
//@access          Public
const updateProfile = async (req, res) => {
  const { about } = req.body;
  let avatar, background;

  if (req.files.avatar) {
    const result = await cloudinary.uploader.upload(req.files.avatar[0].path);
    avatar = {
      url: result.secure_url,
      cloudId: result.public_id,
    }
  }
  if (req.files.background) {
    const result = await cloudinary.uploader.upload(req.files.background[0].path);
    background = {
      url: result.secure_url,
      cloudId: result.public_id,
    }
  }

  if (avatar) await User.findByIdAndUpdate(req.user._id, { avatar: avatar });
  if (background) await User.findByIdAndUpdate(req.user._id, { background: background });
  if (about) await User.findByIdAndUpdate(req.user._id, { about: about });

  const user = await User.findById(req.user._id);

  res.status(StatusCodes.OK).send(user);
};

//@description     Update status message
//@route           PATCH /api/user/status
//@access          Public
const updateStatusMessage = async (req, res) => {
  const { statusMessage } = req.body;

  if (statusMessage) await User.findByIdAndUpdate(req.user._id, { statusMessage: statusMessage });

  const user = await User.findById(req.user._id);

  res.status(StatusCodes.OK).send(user);
};

//@description     Change account password
//@route           PATCH /api/user/password
//@access          Public
const changePassword = async (req, res) => {
  const { password, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  if (!(await user.matchPassword(password))) throw new BadRequestError("password does not match");

  if (newPassword) {
    let updatePassword = newPassword;
    const salt = await bcrypt.genSalt(10);
    updatePassword = await bcrypt.hash(updatePassword, salt);
    await User.findByIdAndUpdate(req.user._id, { password: updatePassword });
  }
  else throw new BadRequestError("New password is empty");

  res.status(StatusCodes.OK).send("Successfully chang password!");
};

module.exports = { searchUser, registerUser, authUser, authJWT, updateProfile, getUserProfile, updateStatusMessage, changePassword };
