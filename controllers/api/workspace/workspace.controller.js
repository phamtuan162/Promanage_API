const {
  Workspace,
  Board,
  Card,
  User,
  Role,
  UserWorkspaceRole,
  Activity,
  Mission,
  UserCard,
  Notification,
} = require("../../../models/index");
const { object, string, date } = require("yup");
const { Op } = require("sequelize");
const WorkspaceTransformer = require("../../../transformers/workspace/workspace.transformer");
const moment = require("moment");

module.exports = {
  index: async (req, res) => {
    const {
      order = "desc",
      sort = "updated_at",
      q,
      isActive,
      limit,
      page = 1,
    } = req.query;
    const filters = {};

    if (isActive) {
      filters.isActive = isActive;
    }
    const options = {
      order: [[sort, order]],
      where: filters,
      include: {
        model: Board,
        as: "boards",
      },
    };
    if (limit && Number.isInteger(+limit)) {
      const offset = (page - 1) * limit;
      options.limit = limit;
      options.offset = offset;
    }

    const response = {};
    try {
      const { count, rows: workspaces } = await Workspace.findAndCountAll(
        options
      );
      response.status = 200;
      response.message = "Success";
      response.data = new WorkspaceTransformer(workspaces);
    } catch (e) {
      response.status = 500;
      response.message = "Server error";
    }

    res.status(response.status).json(response);
  },

  find: async (req, res) => {
    const user = req.user.dataValues;
    const { id } = req.params;
    const response = {};

    if (!id) {
      return res.status(400).json({
        status: 400,
        message: "Bad request",
      });
    }

    try {
      const workspace = await Workspace.findByPk(id, {
        include: [
          {
            model: Board,
            as: "boards",
          },
          {
            model: User,
            as: "users",
            attributes: { exclude: ["password"] }, // Loại trừ trường password
          },
          {
            model: Activity,
            as: "activities",
            required: false, // Thực hiện LEFT JOIN thay vì INNER JOIN
            where: { card_id: { [Op.is]: null } }, // Điều kiện card_id là null
          },
        ],
      });

      if (!workspace) {
        const userNew = await findByPk(user.id, {
          include: { model: Workspace, as: "workspaces" },
        });

        if (userNew.workspaces) {
          await userNew.update({
            workspace_id_active: userNew.workspaces[0].id,
          });
          return res.status(404).json({
            status: 404,
            message:
              "Không tìm thấy workspace này, tự động chuyển đến workspace khác.",
            workspace_id: userNew.workspaces[0].id,
          });
        }

        return res.status(400).json({
          status: 400,
          message: "Bạn không tham gia hay sở hữu không gian nào",
        });
      }

      if (workspace?.users?.length > 0) {
        // Dùng Promise.all để thực hiện các truy vấn đồng thời cho tất cả người dùng
        await Promise.all(
          workspace.users.map(async (user) => {
            const user_workspace_role = await UserWorkspaceRole.findOne({
              where: { workspace_id: workspace.id, user_id: user.id },
            });

            if (user_workspace_role) {
              const role = await Role.findByPk(user_workspace_role.role_id);
              user.dataValues.role = role ? role.name : null; // Đảm bảo có role.name nếu role tồn tại
            }
          })
        );
      }

      Object.assign(response, {
        status: 200,
        message: "Success",
        data: new WorkspaceTransformer(workspace),
      });
    } catch (e) {
      Object.assign(response, {
        status: 500,
        message: "Sever Error",
      });
    }
    res.status(response.status).json(response);
  },

  store: async (req, res) => {
    const { user_id } = req.query;
    const response = {};
    const user = await User.findByPk(user_id);

    if (!user) {
      Object.assign(response, {
        status: 404,
        message: "Not found user",
      });
    } else {
      const schema = object({
        name: string().required("Chưa nhập tên không gian làm việc"),
      });
      try {
        const body = await schema.validate(req.body, {
          abortEarly: false,
        });
        const workspace = await Workspace.create({ ...body, total_user: 1 });

        if (workspace) {
          const user_workspace_role = await UserWorkspaceRole.create({
            user_id: user.id,
            workspace_id: workspace.id,
          });

          await user.update({
            workspace_id_active: workspace.id,
          });

          const role = await Role.findOne({
            where: { name: { [Op.iLike]: "%Owner%" } },
          });

          if (role) {
            await user_workspace_role.update({
              role_id: role.id,
            });
            const workspaceNew = await Workspace.findByPk(workspace.id, {
              include: { model: User, as: "users" },
            });
            if (workspaceNew.users) {
              for (const user of workspaceNew.users) {
                const user_workspace_role = await UserWorkspaceRole.findOne({
                  where: { workspace_id: workspace.id, user_id: user.id },
                });
                const role = await Role.findByPk(user_workspace_role.role_id);

                user.dataValues.role = role.name;
              }
            }
            Object.assign(response, {
              status: 200,
              message: "Success",
              data: new WorkspaceTransformer(workspaceNew),
            });
          } else {
            Object.assign(response, {
              status: 500,
              message: "Sever error",
            });
          }
        } else {
          Object.assign(response, {
            status: 500,
            message: "Sever error",
          });
        }
      } catch (e) {
        console.log(e);
        const errors = Object.fromEntries(
          e?.inner?.map(({ path, message }) => [path, message])
        );
        Object.assign(response, {
          status: 400,
          message: "Bad Request",
          errors,
        });
      }
    }

    res.status(response.status).json(response);
  },

  update: async (req, res) => {
    const { id } = req.params;
    const method = req.method;
    const rules = {};

    if (req.body.title) {
      rules.title = string().required("Chưa nhập tiêu đề");
    }

    const schema = object(rules);
    const response = {};
    //Validate
    try {
      let body = await schema.validate(req.body, {
        abortEarly: false,
      });

      // if (method === "PUT") {
      //   body = Object.assign(
      //     {
      //       desc: null,
      //     },
      //     body
      //   );
      // }
      await Workspace.update(body, {
        where: { id },
      });
      // const workspace = await Workspace.findByPk(id, {
      //   include: {
      //     model: Board,
      //     as: "boards",
      //   },
      // });
      Object.assign(response, {
        status: 200,
        message: "Success",
        // data: new WorkspaceTransformer(workspace),
      });
    } catch (e) {
      const errors = Object.fromEntries(
        e?.inner.map(({ path, message }) => [path, message])
      );
      Object.assign(response, {
        status: 400,
        message: "Bad Request",
        errors,
      });
    }
    res.status(response.status).json(response);
  },

  delete: async (req, res) => {
    const user = req.user.dataValues;
    const { id } = req.params;
    const response = {};

    try {
      const userNew = await User.findByPk(user.id, {
        include: { model: Workspace, as: "workspaces" },
      });

      if (userNew?.workspaces?.length <= 1) {
        return res.status(400).json({
          status: 400,
          message:
            "Bạn chỉ sở hữu 1 không gian làm việc này nên không xóa được",
        });
      }

      const workspace = await Workspace.findByPk(id, {
        include: { model: User, as: "users" },
      });

      if (!workspace) {
        return res
          .status(404)
          .json({ status: 404, message: "Not found workspace" });
      }

      const usersWorkspace = workspace.users;

      await workspace.destroy();

      const users = await User.findAll({
        where: { workspace_id_active: id },
        include: [
          {
            model: Workspace,
            as: "workspaces",
            order: [["updated_at", "desc"]],
          },
        ],
      });

      let activeWorkspaceId;

      if (users?.length) {
        await Promise.all(
          users.map(async (u) => {
            if (u?.workspaces) {
              const latestWorkspace = u.workspaces[0];
              if (u.id === user.id) activeWorkspaceId = latestWorkspace.id;
              await User.update(
                { workspace_id_active: latestWorkspace.id },
                { where: { id: u.id } }
              );
            }
          })
        );
      }

      if (!activeWorkspaceId) {
        return res.status(400).json({
          status: 400,
          message: "This is not the active workspace of the user",
        });
      }

      if (usersWorkspace.length) {
        const notification = {
          userName: user.name,
          userAvatar: user.avatar,
          type: "delete_workspace",
          content: `đã xóa Không gian làm việc ${workspace.name}`,
        };

        await Promise.all(
          usersWorkspace
            .filter((u) => u.id !== user.id)
            .map((u) => Notification.create({ user_id: u.id, ...notification }))
        );
      }

      const user_workspace_role = await UserWorkspaceRole.findOne({
        where: {
          workspace_id: activeWorkspaceId,
          user_id: user.id,
        },
      });

      const role = await Role.findByPk(user_workspace_role.role_id);

      Object.assign(response, {
        status: 200,
        message: "Success",
        data: {
          workspace_id_active: activeWorkspaceId,
          role: role.name,
          id: user.id,
        },
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

  inviteUser: async (req, res) => {
    const userMain = req.user.dataValues;
    const { user_id, workspace_id, role } = req.body;
    const response = {};

    if (!user_id || !workspace_id || !role) {
      return res.status(400).json({ status: 400, message: "Bad request" });
    }

    try {
      const [user, workspace] = await Promise.all([
        User.findByPk(user_id),
        Workspace.findByPk(workspace_id, {
          include: [{ model: User, as: "users" }],
        }),
      ]);

      if (!user || !workspace) {
        return res
          .status(404)
          .json({ status: 404, message: "User or Workspace not found" });
      }

      const [roleInstance] = await Role.findOrCreate({
        where: { name: { [Op.iLike]: `%${role}%` } },
        defaults: { name: role },
      });

      const [user_workspace_role, created] =
        await UserWorkspaceRole.findOrCreate({
          where: { user_id, workspace_id },
          defaults: {
            user_id,
            workspace_id,
            role_id: roleInstance.id,
          },
          paranoid: false,
        });

      if (!created) {
        const deletedAt = moment(user_workspace_role.deleted_at);
        const now = moment();

        const duration = now.diff(deletedAt, "minutes");

        if (duration <= 30) {
          return res.status(400).json({
            status: 400,
            message: `Cần chờ thêm ${
              30 - duration
            } phút nữa mới mời lại được người dùng này vào không gian làm việc.`,
          });
        }
        await user_workspace_role.restore();
      }

      await workspace.update({ total_user: +workspace.users.length + 1 });

      const activity = await Activity.create({
        user_id: userMain.id,
        userName: userMain.name,
        userAvatar: userMain.avatar,
        title: workspace.name,
        action: "invite_user",
        workspace_id: workspace_id,
        desc: `đã thêm ${user.name} vào Không gian làm việc này`,
      });

      const notification = await Notification.create({
        user_id: user.id,
        userName: userMain.name,
        userAvatar: userMain.avatar,
        type: "invite_user",
        content: `đã mời bạn vào Không gian làm việc ${workspace.name} với tư cách ${role}`,
        status: "unread",
        onClick: false,
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
        activity,
        notification,
      });
    } catch (error) {
      console.log(error);

      Object.assign(response, {
        status: 500,
        message: "Server error",
      });
    }

    res.status(response.status).json(response);
  },

  leaveWorkspace: async (req, res) => {
    const { user_id, workspace_id, removeLinks } = req.body;
    const response = {};

    if (!user_id || !workspace_id) {
      return res.status(400).json({ status: 400, message: "Bad request" });
    }

    try {
      const [user, workspace] = await Promise.all([
        User.findByPk(user_id, {
          include: {
            model: Workspace,
            as: "workspaces",
            required: false,

            where: {
              id: { [Op.ne]: workspace_id },
            },
            order: [["updated_at", "desc"]],
          },
        }),
        Workspace.findByPk(workspace_id, {
          include: {
            model: User,
            as: "users",
          },
        }),
      ]);

      if (!workspace || !user) {
        return res
          .status(404)
          .json({ status: 404, message: "Not found workspace or user" });
      }

      const user_workspace_role = await UserWorkspaceRole.findOne({
        where: { user_id, workspace_id },
      });

      if (!user_workspace_role) {
        return res.status(404).json({ status: 404, message: "Not found" });
      }

      await user_workspace_role.destroy();

      if (
        user?.workspace_id_active === workspace_id &&
        user?.workspaces?.length > 0
      ) {
        await user.update({ workspace_id_active: user.workspaces[0].id });
      }

      if (removeLinks) {
        const cards = await Card.findAll({
          where: { workspace_id },
          include: {
            model: User,
            as: "users",
            where: { id: user_id },
            through: { attributes: [] },
          },
        });

        if (cards?.length > 0) {
          const cardIds = cards.map((c) => c.id);

          await Promise.all([
            UserCard.destroy({
              where: { user_id, card_id: { [Op.in]: cardIds } },
              force: true,
            }),
            // Comment.destroy({
            //   where: { user_id, card_id: { [Op.in]: cardIds } },
            //   force: true,
            // }),
          ]);
        }

        await Mission.update(
          { user_id: null },
          { where: { workspace_id, user_id } }
        );
      }

      await workspace.update({ total_user: +workspace.users.length - 1 });

      const activity = await Activity.create({
        user_id: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        title: workspace.name,
        action: "leave_user",
        workspace_id: workspace_id,
        desc: `đã rời khỏi Không gian làm việc này`,
      });
      Object.assign(response, {
        status: 200,
        message: "Success",
        activity,
      });
    } catch (error) {
      Object.assign(response, {
        status: 500,
        message: "Server error",
      });
    }
    res.status(response.status).json(response);
  },

  cancelUser: async (req, res) => {
    const userMain = req.user.dataValues;
    const { user_id, workspace_id, removeLinks } = req.body;

    if (!user_id || !workspace_id) {
      return res.status(400).json({ status: 400, message: "Bad request" });
    }

    try {
      const [user, workspace] = await Promise.all([
        User.findByPk(user_id, {
          include: [
            {
              model: Workspace,
              as: "workspaces",
              required: false, // LEFT JOIN
              where: {
                id: { [Op.ne]: workspace_id },
              },
              order: [["updated_at", "desc"]],
            },
          ],
        }),
        Workspace.findByPk(workspace_id, {
          include: [
            {
              model: User,
              as: "users",
            },
          ],
        }),
      ]);
      console.log(user);

      if (!workspace || !user) {
        return res
          .status(404)
          .json({ status: 404, message: "Not found workspace or user" });
      }

      const user_workspace_role = await UserWorkspaceRole.findOne({
        where: { user_id, workspace_id },
      });

      if (!user_workspace_role) {
        return res.status(404).json({ status: 404, message: "Not found" });
      }

      await user_workspace_role.destroy();

      if (
        user?.workspace_id_active === workspace_id &&
        user?.workspaces?.length
      ) {
        await user.update({ workspace_id_active: user.workspaces[0].id });
      }

      if (removeLinks) {
        const cards = await Card.findAll({
          where: { workspace_id },
          include: {
            model: User,
            as: "users",
            where: { id: user_id },
            through: { attributes: [] },
          },
        });

        if (cards?.length > 0) {
          const cardIds = cards.map((c) => c.id);

          await Promise.all([
            UserCard.destroy({
              where: { user_id, card_id: { [Op.in]: cardIds } },
              force: true,
              // Comment.destroy({
              //   where: { user_id, card_id: { [Op.in]: cardIds } },
              //   force: true,
              // }),
            }),
          ]);
        }

        await Mission.update(
          { user_id: null },
          { where: { workspace_id, user_id } }
        );
      }

      await workspace.update({ total_user: +workspace.users.length - 1 });

      const activity = await Activity.create({
        user_id: userMain.id,
        userName: userMain.name,
        userAvatar: userMain.avatar,
        title: workspace.name,
        action: "cancel_user",
        workspace_id,
        desc: `đã loại bỏ ${user.name} khỏi Không gian làm việc này`,
      });

      const notification = await Notification.create({
        user_id: user.id,
        userName: userMain.name,
        userAvatar: userMain.avatar,
        type: "invite_user",
        content: `đã loại bỏ bạn khỏi Không gian làm việc ${workspace.name} `,
        status: "unread",
        onClick: false,
      });

      return res
        .status(200)
        .json({ status: 200, message: "Success", activity, notification });
    } catch (error) {
      console.log(error);

      return res.status(500).json({ status: 500, message: "Server error" });
    }
  },

  changeWorkspace: async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;

    const response = {};

    if (!user_id || !id) {
      return res.status(400).json({ status: 400, message: "Bad request" });
    }

    try {
      const [workspace, user, user_workspace_role] = await Promise.all([
        Workspace.findByPk(id),
        User.findByPk(user_id),
        UserWorkspaceRole.findOne({
          where: { user_id, workspace_id: id },
        }),
      ]);

      if (!workspace || !user || !user_workspace_role) {
        return res
          .status(404)
          .json({ status: 404, message: "Not found workspace or user" });
      }

      await user.update({ workspace_id_active: id });

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

  decentRoleUser: async (req, res) => {
    const userMain = req.user.dataValues;
    const { id } = req.params;
    const { user_id, role, notification } = req.body;
    const response = {};
    if (!user_id || !role || !notification) {
      return res.status(400).json({ status: 400, message: "Bad request" });
    }
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }

    const roleInstance = await Role.findOne({
      where: { name: { [Op.iLike]: `%${role}%` } },
    });

    if (!roleInstance) {
      return res.status(404).json({ status: 404, message: "Role not found" });
    }
    const user_workspace_role = await UserWorkspaceRole.findOne({
      where: {
        user_id: user_id,
        workspace_id: id,
      },
    });

    if (!user_workspace_role) {
      return res.status(404).json({ status: 404, message: " Not found" });
    }

    user_workspace_role.update({ role_id: roleInstance.id });

    const activity = await Activity.create({
      user_id: userMain.id,
      userName: userMain.name,
      userAvatar: userMain.avatar,
      action: "decent_role",
      workspace_id: id,
      desc: `đã chuyển chức vụ ${user.name} thành ${roleInstance.name} trong Không gian làm việc này`,
    });

    await Notification.create(notification);

    Object.assign(response, {
      status: 200,
      message: "Success",
      activity,
    });
    res.status(response.status).json(response);
  },

  restore: async (req, res) => {
    const { id } = req.params;
    const response = {};
    const workspace = await Workspace.findByPk(id, {
      paranoid: false,
    });
    if (!workspace) {
      return res
        .status(404)
        .json({ status: 404, message: "Not found workspace" });
    }
    try {
      await workspace.restore();

      Object.assign(response, {
        status: 200,
        message: "Success",
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
};
