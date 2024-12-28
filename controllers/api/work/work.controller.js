const { Card, Work, Mission, Activity } = require("../../../models/index");
const { object, string, date } = require("yup");
const { Op } = require("sequelize");
module.exports = {
  index: async (req, res) => {
    const { order = "desc", sort = "created_at", q, card_id } = req.query;
    const filters = {};
    if (card_id) {
      filters.card_id = card_id;
    }
    const options = {
      order: [[sort, order]],
      where: filters,
    };
    const response = {};
    try {
      const works = await Work.findAll(options);
      response.status = 200;
      response.message = "Success";
      response.data = works;
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
      const work = await Work.findByPk(id, {
        include: [
          { model: Card, as: "card" },
          { model: Mission, as: "missions" },
        ],
      });
      if (!work) {
        Object.assign(response, {
          status: 404,
          message: "Not Found",
        });
      } else {
        Object.assign(response, {
          status: 200,
          message: "Success",
          data: work,
        });
      }
    } catch (e) {
      response.status = 500;
      response.message = "Server Error";
    }
    res.status(response.status).json(response);
  },
  store: async (req, res) => {
    const user = req.user.dataValues;
    const rules = {};

    if (req.body.title) {
      rules.title = string().required("Chưa nhập tiêu đề");
    }

    const schema = object(rules);
    const response = {};
    try {
      const body = await schema.validate(req.body, {
        abortEarly: false,
      });

      const card = await Card.findByPk(req.body.card_id);

      if (!card) {
        return res.status(404).json({ status: 404, message: "Not found card" });
      }

      const work = await Work.create(body);

      const activity = await Activity.create({
        user_id: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        card_id: card.id,
        title: card.title,
        action: "add_mission",
        workspace_id: user.workspace_id_active,
        desc: `đã thêm danh sách công việc ${work.title} vào thẻ này`,
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
        work,
        activity,
      });
    } catch (e) {
      const errors = Object.fromEntries(
        e.inner.map(({ path, message }) => [path, message])
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
    const user = req.user.dataValues;
    const { id } = req.params;
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
      const work = await Work.findByPk(id);

      if (!work) {
        return res.status(404).json({ status: 404, message: "Not found work" });
      }

      const workUpdate = await work.update(body);

      Object.assign(response, {
        status: 200,
        message: "Success",
        data: workUpdate,
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
      const work = await Work.findByPk(id);

      if (!work) {
        return res.status(404).json({ status: 404, message: "Not found" });
      }

      const card = await Card.findByPk(work.card_id);

      if (!card) {
        return res.status(404).json({ status: 404, message: "Not found" });
      }

      await Mission.destroy({ where: { work_id: work.id } });
      // await card.removeWork(work);
      await work.destroy();

      const activity = await Activity.create({
        user_id: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        card_id: card.id,
        title: card.title,
        action: "delete_mission",
        workspace_id: user.workspace_id_active,
        desc: `đã bỏ danh sách công việc ${work.title} khỏi thẻ này`,
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
};
