const { UserWorkspaceRole, Role, Permission } = require("../../models/index");

module.exports = (permission) => {
  return async (req, res, next) => {
    const user = req.user.dataValues;
    const { workspace_id } = req.body;

    const response = {};

    try {
      const user_workspace_role = await UserWorkspaceRole.findOne({
        where: {
          user_id: user.id,
          workspace_id: workspace_id ? workspace_id : user.workspace_id_active,
        },
      });

      if (!user_workspace_role) {
        return res
          .status(404)
          .json({ status: 404, message: "Not found user_workspace_role" });
      }

      const role = await Role.findOne({
        where: {
          id: user_workspace_role.role_id,
        },
        include: {
          model: Permission,
          as: "permissions",
        },
      });

      if (!role) {
        return res.status(404).json({ status: 404, message: "Not found role" });
      }

      // Lấy tất cả quyền từ role.permissions vào mảng `permissions` mà không cần kiểm tra trùng lặp
      const permissions = Array.from(
        new Set(role.permissions.map((permission) => permission.value))
      );

      // Kiểm tra 1 quyền cụ thể
      req.can = (value) => permissions.includes(value);

      // Nếu quyền đã tồn tại, tiếp tục xử lý
      if (permissions.includes(permission)) {
        return next();
      }

      Object.assign(response, {
        status: 401,
        message: "Bạn không có đủ quyền hạn để thực hiện thao tác này",
      });
    } catch (error) {
      console.log(error);

      Object.assign(response, {
        status: 500,
        message: "Sever error",
      });
    }

    res.status(response.status).json(response);
  };
};
