const jwt = require("jsonwebtoken");
const { User, BlacklistToken } = require("../../models/index");
module.exports = async (req, res, next) => {
  const token = req.cookies?.access_token;
  const { JWT_SECRET } = process.env;

  if (!token) {
    return res.status(401).json({ status: 401, message: "Not found token" });
  }

  const response = {};
  try {
    var decoded = jwt.verify(token, JWT_SECRET);

    const blacklist = await BlacklistToken.findOne({
      where: {
        token,
      },
    });

    if (blacklist) {
      throw new Error("Token blacklist");
    }

    const { data: userId } = decoded;
    const user = await User.findOne({
      where: {
        id: userId,
      },

      attributes: {
        exclude: ["password"],
      },
    });

    if (!user) {
      throw new Error("User Not Found");
    }

    req.user = {
      ...user,
    };

    return next();
  } catch (error) {
    Object.assign(response, {
      status: 401,
      message: "Link xác thực đã hết hạn hoặc không tồn tại!",
      isMessage: true,
    });
  }

  return res.json(response);
};
