const { Activity, User, Workspace, Card } = require("../../../models/index");

module.exports = {
  index: async (req, res) => {
    const { order = "desc", sort = "created_at" } = req.query;
    const filters = {};

    const options = {
      order: [[sort, order]],
      where: filters,
    };
    const response = {};
    try {
      const activities = await Activity.findAll(options);
      response.status = 200;
      response.message = "Success";
      response.data = activities;
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
      const activity = await Activity.findByPk(id);
      if (!activity) {
        Object.assign(response, {
          status: 404,
          message: "Not Found",
        });
      } else {
        Object.assign(response, {
          status: 200,
          message: "Success",
          data: activity,
        });
      }
    } catch (e) {
      response.status = 500;
      response.message = "Server Error";
    }
    res.status(response.status).json(response);
  },
  store: async (req, res) => {
    const { user_id, action, workspace_id, board_id, column_id, card_id } =
      req.body;
    const response = {};
    const actions = ["create", "update", "move", "copy"];
    try {
      if (
        !action ||
        !user_id ||
        !workspace_id ||
        (!board_id && !column_id && !card_id)
      ) {
        return res.status(400).json({ status: 400, message: "Bad request" });
      }

      if (!actions.includes(action.toLowerCase().trim())) {
        return res.status(400).json({ status: 400, message: "Bad request" });
      }

      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(404).json({ status: 404, message: "Not found" });
      }

      const workspace = await Workspace.findByPk(workspace_id);
      if (!workspace) {
        return res.status(404).json({ status: 404, message: "Not found" });
      }

      const activity = await Activity.create({
        ...req.body,
        userName: user.name,
        userAvatar: user.avatar,
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
        data: activity,
      });
    } catch (error) {
      Object.assign(response, {
        status: 500,
        message: "Sever error",
      });
    }
    res.status(response.status).json(response);
  },
  update: async (req, res) => {},
  delete: async (req, res) => {
    const { card_id } = req.body;
    const response = {};
    try {
      const card = await Card.findByPk(card_id);
      if (!card) {
        return res.status(404).json({ status: 404, message: "Not found" });
      }
      await Activity.destroy({ where: { card_id: card_id } });

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
};
