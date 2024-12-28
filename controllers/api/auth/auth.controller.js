const jwt = require("jsonwebtoken");
const {
  User,
  BlacklistToken,
  Device,
  Provider,
  Workspace,
  Board,
  UserWorkspaceRole,
  Role,
  Notification,
} = require("../../../models/index");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
var ip = require("ip");
const ms = require("ms");
const UAParser = require("ua-parser-js");
const sendMail = require("../../../utils/mail");
const generateToken = () => {
  return crypto.randomBytes(16).toString("hex");
};
module.exports = {
  login: async (req, res) => {
    //Lấy body
    const { email, password } = req.body;
    const userAgent = req.headers["user-agent"];
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    //Validate
    const response = {};
    if (!email || !password) {
      return res.status(400).json({
        status: 400,
        message: "Vui lòng nhập email và mật khẩu",
      });
    }
    try {
      //Kiểm tra email có tồn tại trong Database không?
      const user = await User.findOne({
        where: { email: email },
        paranoid: false,
      });

      if (!user) {
        return res.status(400).json({
          status: 400,
          message: "Email hoặc mật khẩu không chính xác",
          isMessage: true,
        });
      }

      if (user.deleted_at) {
        return res.status(400).json({
          status: 400,
          message:
            "Tài khoản này đã bị xóa tạm thời. Để khôi phục, vui lòng chọn 'Quên mật khẩu'.",
          isMessage: true,
        });
      }

      if (user?.status === false) {
        return res.status(400).json({
          status: 400,
          message: "Tài khoản chưa được kích hoạt",
          isMessage: true,
        });
      }

      //Lấy password hash
      const { password: hash } = user;
      if (hash === null) {
        return res.status(400).json({
          status: 400,
          message:
            "Email này đã được đăng nhập bằng google ấn quên mật khẩu để lấy mật khẩu",
          isMessage: true,
        });
      }
      const result = bcrypt.compareSync(password, hash);

      if (!result) {
        return res.status(400).json({
          status: 400,
          message: "Email hoặc mật khẩu không chính xác",
          isMessage: true,
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

      await User.update(
        {
          refresh_token: refresh,
        },
        {
          where: { id: user.id },
        }
      );

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

      Object.assign(response, {
        status: 200,
        message: "Success",
        device_id_current: device.id,
      });
    } catch (error) {
      Object.assign(response, {
        status: 500,
        message: "Sever error",
      });
    }

    res.status(response.status).json(response);
  },
  register: async (req, res) => {
    //Lấy body
    const { email, password, name } = req.body;
    //Validate
    const response = {};

    if (!email || !password || !name) {
      return res.status(400).json({
        status: 400,
        message: "Vui lòng nhập đầy đủ thông tin",
        isMessage: true,
      });
    }
    try {
      //Kiểm tra email có tồn tại trong Database không?
      const user = await User.findOne({
        where: { email },
      });
      if (user) {
        return res.status(400).json({
          status: 400,
          message: email.status
            ? "Email đã tồn tại"
            : "Email đã tồn tại, chưa xác thực! Vui lòng Quên mật khẩu",

          isMessage: true,
        });
      }

      const salt = bcrypt.genSaltSync(10);
      const hashPassword = await bcrypt.hash(password, salt);

      const userNew = await User.create({
        name: name,
        email: email,
        password: hashPassword,
        status: false,
      });

      const { JWT_SECRET } = process.env;
      const token = jwt.sign(
        {
          data: { id: userNew.id, email: userNew.email },
        },
        JWT_SECRET,
        {
          expiresIn: "15m",
        }
      );

      const link = `http://localhost:3000/auth/register/verify?token=${token}`;
      const html = `
        <p>Xin chào,</p>
        <p>Liên kết dưới đây sẽ có tác dụng trong <strong>15 phút</strong>. Vui lòng nhấn vào liên kết để xác thực tài khoản của bạn trong khoảng thời gian đó!</p>
        <a href="${link}" style="background-color: #007BFF; color: #ffffff !important; display: inline-block; text-align:center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 36px; margin: 0 !important; max-width: 160px; padding: 10px; text-decoration: none; width: 160px !important; border-radius: 3px; border-spacing: 0;">Xác thực tài khoản</a>
        <p>Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
        <p>Trân trọng,</p>
        <p>Đội ngũ hỗ trợ</p>
    `;

      await sendMail(email, "Xác thực tài khoản", html);

      Object.assign(response, {
        status: 200,
        message:
          "Bạn đã đăng ký thành công. Vui lòng vào email để xác thực tài khoản!",
        isMessage: true,
      });
    } catch (error) {
      Object.assign(response, {
        status: 500,
        message: "Sever error",
      });
    }

    res.status(response.status).json(response);
  },
  checkEmail: async (req, res) => {
    const { email } = req.body;
    const response = {};
    try {
      const user = await User.findOne({
        where: { email },
      });
      if (user) {
        return res.status(400).json({
          status: 400,
          message: "Email đã tồn tại",
        });
      }
      Object.assign(response, {
        status: 200,
        message: "Success",
        data: { email: email },
      });
    } catch (error) {
      Object.assign(response, {
        status: 500,
        message: "Sever error",
      });
    }

    res.status(response.status).json(response);
  },

  profile: async (req, res) => {
    const { id } = req.user.dataValues;
    const response = {};
    try {
      const user = await User.findByPk(id, {
        include: [
          {
            model: Device,
            as: "devices",
          },
          {
            model: Workspace,
            as: "workspaces",
            paranoid: false,
          },
          {
            model: Provider,
            as: "providers",
          },
        ],

        attributes: { exclude: ["password"] },
      });
      if (!user) {
        return res.status(404).json({
          status: 404,
          message: "Not found user",
        });
      }

      await user.update({ isOnline: true });

      user.dataValues.isOnline = true;

      const user_workspace_role = await UserWorkspaceRole.findOne({
        where: { user_id: id, workspace_id: user.workspace_id_active },
      });

      if (user_workspace_role?.role_id) {
        const role = await Role.findByPk(user_workspace_role.role_id);
        if (role) {
          user.dataValues.role = role.name;
        }
      }

      if (user.workspaces.length > 0) {
        for (const workspace of user.workspaces) {
          const user_workspace_role_item = await UserWorkspaceRole.findOne({
            where: { user_id: id, workspace_id: workspace.id },
          });
          if (user_workspace_role_item) {
            const role = await Role.findByPk(user_workspace_role_item.role_id);
            if (role) {
              workspace.dataValues.role = role.name;
            }
          }
        }
      }

      Object.assign(response, {
        status: 200,
        message: "Success",
        data: user,
      });
    } catch (error) {
      console.log(error);

      Object.assign(response, {
        status: 500,
        message: "Sever error",
      });
    }

    res.status(response.status).json(response);
  },

  logout: async (req, res) => {
    const { id } = req.body;
    const accessToken = req.cookies?.access_token;
    const response = {};

    try {
      // Kiểm tra và thêm access token vào blacklist nếu tồn tại
      if (accessToken) {
        await BlacklistToken.findOrCreate({
          where: { token: accessToken },
          defaults: { token: accessToken },
        });
      }

      // Xóa cookies
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");

      // Nếu có `id`, cập nhật trạng thái người dùng
      if (id) {
        await User.update(
          { isOnline: false, refresh_token: null },
          { where: { id } }
        );
      }

      Object.assign(response, {
        status: 200,
        message: "Success",
      });
    } catch (error) {
      Object.assign(response, {
        status: 500,
        message: "Server error",
      });
    }

    // Trả về phản hồi
    res.status(response.status).json(response);
  },

  refresh: async (req, res) => {
    const refreshToken = req.cookies?.refresh_token;
    const response = {};

    try {
      if (!refreshToken) {
        throw new Error("refresh_token not found");
      }

      const { JWT_SECRET, JWT_EXPIRE } = process.env;

      jwt.verify(refreshToken, JWT_SECRET);

      const user = await User.findOne({
        where: {
          refresh_token: refreshToken,
        },
      });

      if (!user) {
        throw new Error("User Not Found");
      }

      const accessToken = jwt.sign(
        {
          data: user.id,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRE }
      );

      res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: ms("14 days"),
        path: "/",
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
        access_token: accessToken,
      });
    } catch (e) {
      Object.assign(response, {
        status: 401,
        message: "Please sign in! Error from to refresh_token",
      });
    }

    res.status(response.status).json(response);
  },

  changePassword: async (req, res) => {
    const { id } = req.params;
    const { password_old, password_new } = req.body;
    const response = {};
    try {
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          status: 404,
          message: "Not found user",
        });
      }
      const { password: hash } = user;
      if (hash === null) {
        return res.status(400).json({
          status: 400,
          message: "Tài khoản này đăng nhập bằng mxh chưa được kích hoạt",
          isMessage: true,
        });
      }

      const result = bcrypt.compareSync(password_old, hash);
      if (!result) {
        return res.status(400).json({
          status: 400,
          message: "Mật khẩu hiện tại không chính xác",
          isMessage: true,
        });
      }

      const salt = bcrypt.genSaltSync(10);
      const hashPassword = await bcrypt.hash(password_new, salt);
      await User.update(
        {
          password: hashPassword,
        },
        {
          where: { id: id },
        }
      );
      Object.assign(response, {
        status: 200,
        message: "Success",
      });
    } catch (error) {
      Object.assign(response, {
        status: 500,
        message: "Sever error",
      });
    }

    res.status(response.status).json(response);
  },

  forgotPassword: async (req, res) => {
    const tokenOld = req.cookies?.token;
    const { email } = req.body;
    const response = {};
    if (!email) {
      return res.status(400).json({
        status: 400,
        message: "Vui lòng nhập email",
        isMessage: true,
      });
    }
    try {
      if (tokenOld) {
        await BlacklistToken.findOrCreate({
          where: {
            token: tokenOld,
          },
          defaults: { token: tokenOld },
        });
      }
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(400).json({
          status: 400,
          message: "Not found user",
        });
      }
      const { JWT_SECRET } = process.env;
      const token = jwt.sign(
        {
          data: { id: user.id, email: user.email },
        },
        JWT_SECRET,
        {
          expiresIn: "15m",
        }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: ms("15m"),
        path: "/",
      });

      const link = `http://localhost:3000/auth/reset-password?token=${token}`;
      const html = `
      <p>Xin chào,</p>
      <p>Bạn vừa yêu cầu làm mới mật khẩu. Vui lòng nhấn vào liên kết bên dưới trong vòng <strong>15 phút</strong> để thực hiện yêu cầu này.</p>
      <a href="${link}" style="background-color: #007BFF; color: #ffffff !important; display: inline-block; text-align:center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 36px; margin: 0 !important; max-width: 160px; padding: 10px; text-decoration: none; width: 160px !important; border-radius: 3px; border-spacing: 0;">Làm mới mật khẩu</a>
      <p>Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
      <p>Trường hợp tài khoản của bạn bị xóa tạm thời và bạn muốn khôi phục tài khoản, vui lòng chọn 'Quên mật khẩu' để tiến hành khôi phục.</p>
      <p>Trân trọng,</p>
      <p>Đội ngũ hỗ trợ</p>
    `;

      await sendMail(email, "Làm mới mật khẩu", html);

      Object.assign(response, {
        status: 200,
        message: "Thành công. Vui lòng vào email kiểm tra!",
      });
    } catch (error) {
      Object.assign(response, {
        status: 500,
        message: "Sever error",
      });
    }

    res.status(response.status).json(response);
  },

  resetPassword: async (req, res) => {
    const { id } = req.user.dataValues;
    const { password_new } = req.body;
    const response = {};

    if (!password_new) {
      return res.status(400).json({
        status: 400,
        message: "Vui lòng nhập password mới",
        isMessage: true,
      });
    }

    try {
      const user = await User.findByPk(id, { paranoid: false });

      if (!user) {
        return res.status(404).json({
          status: 404,
          message: "Not found User",
        });
      }

      if (user.deleted_at) {
        await user.restore();
      }

      const salt = bcrypt.genSaltSync(10);
      const hashPassword = await bcrypt.hash(password_new, salt);

      await user.update({
        password: hashPassword,
        status: true,
      });

      res.clearCookie("token");

      Object.assign(response, {
        status: 200,
        message: "Làm mới mật khẩu thành công",
      });
    } catch (error) {
      Object.assign(response, {
        status: 500,
        message: "Sever error",
      });
    }

    res.status(response.status).json(response);
  },

  verifyAccount: async (req, res) => {
    const { id } = req.user.dataValues;

    const response = {};
    try {
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ status: 404, message: "Not found user" });
      }

      const workspace = await Workspace.create({
        name: "Workspace 1",
        total_user: 1,
        isActive: true,
      });

      if (workspace) {
        const user_workspace_role = await UserWorkspaceRole.create({
          user_id: user.id,
          workspace_id: workspace.id,
        });

        const role = await Role.findOne({
          where: { name: { [Op.iLike]: "%Owner%" } },
        });

        if (role) {
          await user_workspace_role.update({
            role_id: role.id,
          });
          await user.update({
            workspace_id_active: workspace.id,
            status: true,
          });
        }
      }
      Object.assign(response, {
        status: 200,
        message: "Xác thực tài khoản thành công",
      });
    } catch (error) {
      Object.assign(response, {
        status: 500,
        message: "Sever error",
      });
    }

    res.status(response.status).json(response);
  },
};
