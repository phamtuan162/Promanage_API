const jwt = require("jsonwebtoken");
const { User, BlacklistToken } = require("../../models/index");

module.exports = async (req, res, next) => {
  const token = req.cookies?.access_token;

  if (!token) {
    return res.status(403).json({
      message: "Token not found",
    });
  }

  const response = {};

  const { JWT_SECRET } = process.env;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const blacklist = await BlacklistToken.findOne({
      where: {
        token,
      },
    });

    if (blacklist) {
      throw new Error("Token blacklist");
    }

    req.jwtDecoded = decoded;

    const { data: userId } = decoded;

    const user = await User.findOne({
      where: {
        id: userId,
        status: true,
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
      accessToken: token,
    };

    return next();
  } catch (e) {
    console.log(e);

    if (e?.message?.includes("jwt expired")) {
      return res.status(410).json({
        status: 410,
        message: "Need to refresh token",
      });
    }

    Object.assign(response, {
      status: 401,
      message: "Unauthorized",
    });
  }

  res.status(response.status).json(response);
};
