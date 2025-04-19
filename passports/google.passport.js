const {
  User,
  Provider,
  Workspace,
  Role,
  UserWorkspaceRole,
} = require("../models/index");
const GoogleStrategy = require("passport-google-oauth20");
const { Op } = require("sequelize");
module.exports = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://promanage-site.vercel.app/auth/login/google/callback",
    scope: ["profile", "email"],
  },
  async (accessToken, refreshToken, profile, cb) => {
    try {
      const {
        photos: [{ value: avatar }],
        displayName: name,
        emails: [{ value: email }],
      } = profile;

      // Kiểm tra provider
      // Nếu tồn tại --> Lấy provider cũ
      // Nếu ko tồn tại --> Thêm mới provider
      const provider = await Provider.findOrCreate({
        where: { name: "google" },
        defaults: {
          name: "google",
        },
      });
      //Kiểm tra user
      // - Nếu tồn tại --> Lấy user cũ
      // - Nếu ko tồn tại --> Thêm user mới
      const [user] = await User.findOrCreate({
        where: { email, provider_id: provider[0].id },
        defaults: {
          name: name,
          email: email,
          status: true,
          avatar: avatar,
          provider_id: provider[0].id,
        },
      });

      const [role] = await Role.findOrCreate({
        where: { name: { [Op.iLike]: "%Owner%" } },
        defaults: {
          name: "owner",
        },
      });

      const checkWorkspace = await UserWorkspaceRole.findOne({
        where: { user_id: user.id },
      });

      if (!checkWorkspace) {
        const workspace = await Workspace.create({
          name: "Workspace 1",
          total_user: 1,
          isActive: true,
        });

        await Promise.all([
          UserWorkspaceRole.create({
            user_id: user.id,
            role_id: role.id,
            workspace_id: workspace.id,
          }),
          user.update({
            workspace_id_active: workspace.id,
          }),
        ]);
      }

      return cb(null, user || {});
    } catch (error) {
      console.error("Error in Google strategy:", error);
      return cb(error, null);
    }
  }
);
