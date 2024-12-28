const { Permission, Role } = require("../../../models/index");
const { Op } = require("sequelize");
const { object, string } = require("yup");
module.exports = {
  index: async (req, res) => {
    const { order = "asc", sort = "id", value } = req.query;
    let filters = {};
    if (value) {
      filters = {
        value: {
          [Op.iLike]: `%${value}%`,
        },
      };
    }
    const options = {
      order: [[sort, order]],
      where: filters,
    };
    const response = {};
    try {
      const permissions = await Permission.findAll(options);
      response.status = 200;
      response.message = "Success";
      response.data = permissions;
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
      const permission = await Permission.findByPk(id);
      if (!permission) {
        Object.assign(response, {
          status: 404,
          message: "Not Found",
        });
      } else {
        Object.assign(response, {
          status: 200,
          message: "Success",
          data: permission,
        });
      }
    } catch (e) {
      response.status = 500;
      response.message = "Server Error";
    }
    res.status(response.status).json(response);
  },
  store: async (req, res) => {
    let { value } = req.body;
    const rules = {};

    if (value) {
      rules.value = string().required("Chưa nhập dữ liệu cho permission");
    }

    const schema = object(rules);
    const response = {};
    try {
      const body = await schema.validate(req.body, {
        abortEarly: false,
      });
      const permission = await Permission.findOrCreate({
        where: { value },

        defaults: {
          value: value,
        },
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
        data: permission[0],
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
    let { value } = req.body;

    const rules = {};

    if (value) {
      rules.value = string().required("Chưa nhập dữ liệu cho permission");
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
      await Permission.update(body, {
        where: { id },
      });

      const permission = await Permission.findByPk(id);

      Object.assign(response, {
        status: 200,
        message: "Success",
        data: permission,
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
    const { id } = req.params;
    const response = {};

    try {
      const permission = await Permission.findOne({
        where: { id },
        include: {
          model: Role,
          as: "roles",
        },
      });
      if (permission) {
        await permission.removeRoles(permission.roles); //Xóa dữ liệu bảng trung gian
        await permission.destroy();
        Object.assign(response, {
          status: 200,
          message: "Success",
        });
      }
    } catch (error) {
      Object.assign(response, {
        status: 500,
        message: "Sever error",
      });
    }
    res.status(response.status).json(response);
  },
};
