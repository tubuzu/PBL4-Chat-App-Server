const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
  {
    username: { type: String, required: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    avatar: {
      url: { type: String, trim: true },
      cloudId: { type: String, trim: true }
    },
    background: {
      url: { type: String, trim: true },
      cloudId: { type: String, trim: true }
    },
    about: { type: String },
    statusMessage: { type: String },
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// userSchema.pre("findByIdAndUpdate", async function (next) {
//   const password = this.getUpdate().$set.password;
//   if (!password) {
//     return next();
//   }

//   try {
//     const salt = await bcrypt.genSalt(10);
//     const hash = await bcrypt.hash(password, salt);
//     this.update({}, { $set: { password: hash } });
//   } catch (error) {
//     return next(error);
//   }
// });

const User = mongoose.model("User", userSchema);

module.exports = User;
