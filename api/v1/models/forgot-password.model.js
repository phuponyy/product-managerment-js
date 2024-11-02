const mogoose = require("mongoose");
const generate = require("../../../helpers/generate.helper");

const forgotPasswordSchema = new mogoose.Schema(
  {
    email: String,
    otp: String,
    expireAt: {
      type: Date,
      expires: 120,
    },
  },
  { timestamps: true }
);

const ForgotPassword = mogoose.model(
  "ForgotPassword",
  forgotPasswordSchema,
  "forgot-password"
);

module.exports = ForgotPassword;
