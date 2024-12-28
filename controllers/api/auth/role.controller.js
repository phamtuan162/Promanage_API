const { Role, Permission } = require("../../../models/index");
const { Op } = require("sequelize");
const { object, string } = require("yup");
module.exports = {
  index: async (req, res) => {
    const { order = "asc", sort = "id" } = req.query;
    const filters = {};

    const options = {
      order: [[sort, order]],
      where: filters,
      include: {
        model: Permission,
        as: "permissions",
      },
    };
    const response = {};
    try {
      const roles = await Role.findAll(options);
      response.status = 200;
      response.message = "Success";
      response.data = roles;
    } catch (e) {
      response.status = 500;
      response.message = "Server error";
    }

    res.status(response.status).json(response);
  },
  find: async (req, res) => {
    const { id } = req.params;
    const response = {};
    try {
      const role = await Role.findOne({
        where: { id },
        include: { model: Permission, as: "permissions" },
      });
      if (!role) {
        Object.assign(response, {
          status: 404,
          message: "Not Found",
        });
      } else {
        Object.assign(response, {
          status: 200,
          message: "Success",
          data: role.dataValues,
        });
      }
    } catch (e) {
      response.status = 500;
      response.message = "Server Error";
    }
    res.status(response.status).json(response);
  },
  store: async (req, res) => {
    let { name, permissions } = req.body;
    if (!permissions) {
      permissions = [];
    }
    permissions = Array.isArray(permissions) ? permissions : [permissions];
    const rules = {};

    if (name) {
      rules.name = string().required("Chưa nhập tên role");
    }

    const schema = object(rules);
    const response = {};
    try {
      const body = await schema.validate(req.body, {
        abortEarly: false,
      });
      if (name) {
      }
      const role = await Role.create({
        name,
      });
      if (permissions.length && role) {
        const permissionInstance = await Promise.all(
          permissions.map(async (permission) => {
            const [permissionInstance] = await Permission.findOrCreate({
              where: { value: permission.trim() },
              defaults: { value: permission.trim() },
            });
            return permissionInstance;
          })
        );

        await role.addPermissions(permissionInstance);
      }
      const roleCreated = await Role.findOne({
        where: { id: role.id },
        include: {
          model: Permission,
          as: "permissions",
        },
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
        data: roleCreated,
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
  update: async (req, res) => {
    const { id } = req.params;
    let { name, permissions, addPermission } = req.body;
    const response = {};

    if (!name && !permissions && !addPermission) {
      return res.status(400).json({ status: 400, message: "Bad request" });
    }

    // if (!permissions) {
    //   permissions = [];
    // }

    permissions = Array.isArray(permissions) ? permissions : [permissions];
    addPermission = Array.isArray(addPermission)
      ? addPermission
      : [addPermission];

    try {
      // if (method === "PUT") {
      //   body = Object.assign(
      //     {
      //       desc: null,
      //     },
      //     body
      //   );
      // }

      const role = await Role.findByPk(id);

      if (!role) {
        return res.status(404).json({ status: 404, message: "Not found role" });
      }

      if (name) {
        role.name = name;
        await role.save();
      }

      if (addPermission.length) {
        const permissionInstance = await Promise.all(
          addPermission.map(async (permission) => {
            const [permissionInstance] = await Permission.findOrCreate({
              where: { value: permission.trim() },
              defaults: { value: permission.trim() },
            });
            return permissionInstance;
          })
        );

        //3. Update table roles_permissions
        await role.addPermissions(permissionInstance);
      }

      if (
        permissions.length &&
        (!addPermission || addPermission.length === 0)
      ) {
        //Mong muốn: Trả về 1 mảng chứa các instance của từng permission (Nếu tồn tại permissions lấy permission cũ, ngược lại thêm mới và trả instance vừa thêm)
        const permissionInstance = await Promise.all(
          permissions.map(async (permission) => {
            const [permissionInstance] = await Permission.findOrCreate({
              where: { value: permission.trim() },
              defaults: { value: permission.trim() },
            });
            return permissionInstance;
          })
        );

        //3. Update table roles_permissions
        await role.setPermissions(permissionInstance);
      }

      const roleUpdated = await Role.findByPk(role.id, {
        include: { model: Permission, as: "permissions" },
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
        data: roleUpdated,
      });
    } catch (e) {
      Object.assign(response, {
        status: 500,
        message: "Sever error",
        errors,
      });
    }
    res.status(response.status).json(response);
  },
  delete: async (req, res) => {
    const { id } = req.params;
    const response = {};

    try {
      const role = await Role.findOne({
        where: { id },
        include: {
          model: Permission,
          as: "permissions",
        },
      });
      if (role) {
        await role.removePermissions(role.permissions); //Xóa dữ liệu bảng trung gian
        await role.destroy();
        Object.assign(response, {
          status: 200,
          message: "Success",
        });
      }
    } catch (error) {
      Object.assign(response, {
        status: 500,
        message: "Sever error",
        error: error,
      });
    }
    res.status(response.status).json(response);
  },
};
