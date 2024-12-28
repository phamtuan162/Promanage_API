var express = require("express");
const http = require("http");
var router = express.Router();
var ip = require("ip");
const UAParser = require("ua-parser-js");
const jwt = require("jsonwebtoken");
const ms = require("ms");
const { User, Device } = require("../../../models/index");
const authController = require("../../../controllers/api/auth/auth.controller");
const authMiddleware = require("../../../middlewares/api/auth.middleware");
const tokenMiddleware = require("../../../middlewares/api/token.middleware");
const passport = require("passport");

router.post("/check-email", authController.checkEmail);
router.post("/register", authController.register);
router.post("/login", authController.login);
router.put(
  "/change-password/:id",

  authController.changePassword
);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", tokenMiddleware, authController.resetPassword);
router.get("/verify", tokenMiddleware, authController.verifyAccount);

router.get("/google/redirect", (req, res) => {
  const emptyResponse = new http.ServerResponse(req);

  passport.authenticate(
    "google",
    {
      scope: ["email", "profile"],
    },
    (err, user, info) => {
      console.log(err, user, info);
    }
  )(req, emptyResponse);

  const url = emptyResponse.getHeader("location");

  return res.status(200).json({
    status: 200,
    message: "Thành công",

    data: {
      urlRedirect: url,
    },
  });
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
  }),
  async (req, res) => {
    const userAgent = req.headers["user-agent"];
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const user = await User.findOne({
      where: { email: req.user.email },
    });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "Not found user",
      });
    }

    const { JWT_SECRET, JWT_EXPIRE, JWT_REFRESH_EXPIRE } = process.env;

    const token = jwt.sign(
      {
        data: user.id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    const refresh = jwt.sign(
      {
        data: new Date().getTime() + Math.random(),
      },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRE }
    );

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: ms("14 days"),
      path: "/",
    });

    res.cookie("refresh_token", refresh, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: ms("14 days"),
      path: "/",
    });

    // Tìm hoặc tạo mới thông tin thiết bị
    const [device, created] = await Device.findOrCreate({
      where: {
        user_id: user.id,
        browser: browser.name,
        system: os.name,
        ip: ip.address(),
      },
      defaults: {
        user_id: user.id,
        browser: browser.name,
        system: os.name,
        ip: ip.address(),
        login_time: new Date(),
        active_time: new Date(),
        status: true,
      },
    });

    // Nếu thiết bị đã tồn tại, cập nhật lại thông tin
    if (!created) {
      await Device.update(
        { active_time: new Date(), status: true },
        {
          where: {
            id: device.id,
          },
        }
      );
    }
    return res.json({
      status: 200,
      message: "Success",
      device_id_current: device.id,
    });
  }
);

router.get("/github/redirect", (req, res) => {
  const emptyResponse = new http.ServerResponse(req);

  passport.authenticate("github", (err, user, info) => {
    console.log(err, user, info);
  })(req, emptyResponse);

  const url = emptyResponse.getHeader("location");

  return res.status(200).json({
    status: 200,
    message: "Thành công",

    data: {
      urlRedirect: url,
    },
  });
});

router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
  }),
  async (req, res) => {
    const userAgent = req.headers["user-agent"];
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const user = await User.findOne({
      where: { github_id: req.user.github_id },
    });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "Not found user",
      });
    }

    const { JWT_SECRET, JWT_EXPIRE, JWT_REFRESH_EXPIRE } = process.env;
    const token = jwt.sign(
      {
        data: user.id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );
    const refresh = jwt.sign(
      {
        data: new Date().getTime() + Math.random(),
      },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRE }
    );

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: ms("14 days"),
      path: "/",
    });

    res.cookie("refresh_token", refresh, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: ms("14 days"),
      path: "/",
    });

    // Tìm hoặc tạo mới thông tin thiết bị
    const [device, created] = await Device.findOrCreate({
      where: {
        user_id: user.id,
        browser: browser.name,
        system: os.name,
        ip: ip.address(),
      },
      defaults: {
        user_id: user.id,
        browser: browser.name,
        system: os.name,
        ip: ip.address(),
        login_time: new Date(),
        active_time: new Date(),
        status: true,
      },
    });

    // Nếu thiết bị đã tồn tại, cập nhật lại thông tin
    if (!created) {
      await Device.update(
        { active_time: new Date(), status: true },
        {
          where: {
            id: device.id,
          },
        }
      );
    }
    return res.json({
      status: 200,
      message: "Success",
      device_id_current: device.id,
    });
  }
);

router.get("/profile", authMiddleware, authController.profile);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refresh);
module.exports = router;
