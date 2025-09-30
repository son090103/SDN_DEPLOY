const mongoose = require("mongoose");
module.exports.connect = () => {
  try {
    mongoose
      .connect("mongodb://127.0.0.1:27017/hotel_db")
      .then(() => console.log("Connected!")); // đã kết nối thành công
  } catch (error) {
    console.log("error:", error);
  }
};
