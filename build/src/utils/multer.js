"use strict";

var multer = require("multer");
var path = require("path");

// Multer config
module.exports = multer({
  storage: multer.diskStorage({}),
  fileFilter: function fileFilter(req, file, cb) {
    var ext = path.extname(file.originalname);
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" && ext != ".gif") {
      cb(new Error("File type is not supported"), false);
      return;
    }
    cb(null, true);
  }
}).fields([{
  name: 'attachments',
  maxCount: 5
}, {
  name: 'avatar',
  maxCount: 1
}, {
  name: 'background',
  maxCount: 1
}]);

// const multiUpload = upload.array("attachments", 5);

// module.exports = { upload, multiUpload };