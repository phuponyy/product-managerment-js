const mongoose = require("mongoose");

module.exports.connect = async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connect Success!");
  } catch (error) {
    console.log("Coonect Fail!");
  }
};
