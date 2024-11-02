const md5 = require("md5");
const User = require("../models/user.model");
const generateHelper = require("../../../helpers/generate.helper");
const ForgotPassword = require("../models/forgot-password.model");
const sendMailHelper = require("../../../helpers/sendMail.helper");

//NOTE: [POST] /api/v1/users/register
module.exports.register = async (req, res) => {
  req.body.password = md5(req.body.password);

  const existEmail = await User.findOne({
    email: req.body.email,
    deleted: false,
  });

  if (existEmail) {
    res.json({
      code: 400,
      message: "Email đã tồn tại!",
    });
  } else {
    const user = new User({
      fullName: req.body.fullName,
      email: req.body.email,
      password: req.body.password,
      token: generateHelper.generateRandomString(30),
    });
    await user.save();

    const token = user.token;
    res.cookie("token", token);

    res.json({ code: 200, message: "Tạo tài khoản thành công!", token: token });
  }
};

//NOTE: [POST] /api/v1/users/login
module.exports.login = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = await User.findOne({
    email: email,
    deleted: false,
  });

  if (!user) {
    res.json({
      code: 400,
      message: "Email không tìm thấy!",
    });
    return;
  }

  if (md5(password) !== user.password) {
    res.json({
      code: 400,
      message: "Sai mật khẩu!",
    });
    return;
  }

  const token = user.token;
  res.cookie("token", token);

  res.json({
    code: 200,
    message: "Đăng nhận thành công!",
    token: token,
  });
};

//NOTE: [POST] /api/v1/users/password/forgot
module.exports.forgotPassword = async (req, res) => {
  const email = req.body.email;

  const user = await User.findOne({
    email: email,
    deleted: false,
  });

  if (!user) {
    res.json({
      code: 400,
      message: "Email không tồn tại!",
    });
    return;
  }

  const otp = generateHelper.generateRandomString(8);

  const objectForgotPassword = {
    email: email,
    otp: otp,
    expireAt: Date.now(),
  };

  const forgotPassword = new ForgotPassword(objectForgotPassword);
  await forgotPassword.save();

  //TODO: Gửi email
  const subject = "Mã OTP xác nhận lại mật khẩu";
  const html = `
    Mã OTP để lấy lại mật khẩu là: <b style="color: red;">${objectForgotPassword.otp}</b>. Thời hạn sử dụng là 3 phút.
  `;

  sendMailHelper.sendMail(email, subject, html);

  res.json({
    code: 200,
    message: "Đã gửi mã OTP.",
  });
};

//NOTE: [POST] /api/v1/users/password/otp
module.exports.otpPassword = async (req, res) => {
  const otp = req.body.otp;
  const email = req.body.email;

  const result = await ForgotPassword.findOne({
    email: email,
    otp: otp,
  });

  if (!result) {
    res.json({
      code: 400,
      message: "OTP không hợp lệ!",
    });
    return;
  }

  const user = await User.findOne({
    email: email,
  });

  const token = user.token;
  res.cookie("token", token);

  res.json({
    code: 200,
    message: "Xác thực thành công",
    token: token,
  });
};

//NOTE: [POST] /api/v1/users/password/reset
module.exports.resetPassword = async (req, res) => {
  const token = req.body.token;
  const password = req.body.password;

  const user = await User.findOne({
    token: token,
  });

  if (md5(password) === user.password) {
    res.json({
      code: 400,
      message: "Mật khẩu đã cũ! Vui lòng đặt mật khẩu mới!",
    });
    return;
  }

  await User.updateOne(
    {
      token: token,
    },
    {
      password: md5(password),
    }
  );

  res.json({
    code: 200,
    message: "Đổi mật khẩu thành công!",
  });
};

//NOTE: [GET] /api/v1/users/detail
module.exports.detail = async (req, res) => {
  res.json({
    code: 200,
    message: "thành công!",
    info: req.user,
  });
};

//NOTE: [GET] /api/v1/users/list
module.exports.list = async (req, res) => {
  const user = await User.find({ deleted: false }).select("fullName email");
  res.json({
    code: 200,
    message: "Thành công!",
    list: user,
  });
};
