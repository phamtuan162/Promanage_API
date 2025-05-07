const {
  User,
  Provider,
  Workspace,
  Role,
  UserWorkspaceRole,
} = require("../models/index");
const { Op } = require("sequelize");
const GitHubStrategy = require("passport-github2");
module.exports = new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `https://promanage-site.vercel.app/auth/login/github/callback`,
  },
  async (accessToken, refreshToken, profile, cb) => {
    try {
      const {
        id: github_id,
        username: name,
        photos: [{ value: avatar }],
      } = profile;

      const provider = await Provider.findOrCreate({
        where: { name: "github" },
        defaults: {
          name: "github",
        },
      });

      const [user] = await User.findOrCreate({
        where: { github_id, provider_id: provider[0].id },
        defaults: {
          github_id: github_id,
          name: name,
          avatar: avatar,
          status: true,
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
