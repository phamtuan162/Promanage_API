const {
  Mission,
  Work,
  User,
  Card,
  Column,
  Activity,
} = require("../../../models/index");
const { object, string } = require("yup");
const { Op } = require("sequelize");
const CardTransformer = require("../../../transformers/workspace/card.transformer");

module.exports = {
  index: async (req, res) => {
    const {
      order = "desc",
      sort = "created_at",
      q,
      work_id,
      user_id,
      workspace_id,
    } = req.query;
    const filters = {};
    if (work_id) {
      filters.work_id = work_id;
    }
    if (user_id) {
      filters.user_id = user_id;
    }
    if (workspace_id) {
      filters.workspace_id = workspace_id;
    }
    const options = {
      order: [[sort, order]],
      where: filters,
    };
    const response = {};
    try {
      const missions = await Mission.findAll(options);
      if (missions.length > 0) {
        for (const mission of missions) {
          const work = await Work.findByPk(mission.work_id, {
            include: {
              model: Card,
              as: "card",
              include: { model: Column, as: "column" },
            },
          });

          if (work?.card?.column?.board_id) {
            mission.dataValues.board_id = work.card.column.board_id;
            // mission.dataValues.card_id = work.card.id;
            mission.dataValues.cardTittle = work.card.title;
          }
        }
      }
      response.status = 200;
      response.message = "Success";
      response.data = missions;
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
      const mission = await Mission.findByPk(id, {
        include: { model: Work, as: "work" },
      });
      if (!mission) {
        Object.assign(response, {
          status: 404,
          message: "Not Found",
        });
      } else {
        Object.assign(response, {
          status: 200,
          message: "Success",
          data: mission,
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
      rules.title = string().required("Chưa nhập tên");
    }

    const schema = object(rules);
    const response = {};
    try {
      const body = await schema.validate(req.body, {
        abortEarly: false,
      });

      const work = await Work.findByPk(req.body.work_id);

      if (!work) {
        return res.status(404).json({ status: 404, message: "Not found work" });
      }

      const mission = await Mission.create({
        ...body,
        workspace_id: user.workspace_id_active,
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
        data: mission,
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
    const user = req.user.dataValues;
    const { id } = req.params;
    const rules = {};

    if (req.body.name) {
      rules.name = string().required("Chưa nhập tên");
    }

    const schema = object(rules);
    const response = {};
    //Validate
    try {
      let body = await schema.validate(req.body, {
        abortEarly: false,
      });
      const mission = await Mission.findByPk(id);
      if (!mission) {
        return res.status(404).json({ status: 404, message: "Not found" });
      }
      await mission.update(body);
      const work = await Work.findByPk(mission.work_id);
      const card = await Card.findByPk(work.card_id);
      if (req.body.status) {
        await Activity.create({
          user_id: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          card_id: card.id,
          title: card.title,
          action: "status_mission",
          workspace_id: user.workspace_id_active,
          desc:
            req.body.status.toLowerCase() === "success"
              ? `đã hoàn tất ${mission.name} ở thẻ này`
              : `đã đánh dấu ${mission.name} là chưa hoàn tất ở thẻ này`,
        });
      }
      const cardUpdate = await Card.findByPk(card.id, {
        include: { model: Activity, as: "activities" },
      });
      Object.assign(response, {
        status: 200,
        message: "Success",
        data: cardUpdate,
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
      const mission = await Mission.findByPk(id);

      if (!mission) {
        return res
          .status(404)
          .json({ status: 404, message: "Not found mission" });
      }
      // const work = await Work.findByPk(mission.work_id);

      // if (!work) {
      //   return res.status(404).json({ status: 404, message: "Not found work" });
      // }

      // await work.removeMission(mission);
      await mission.destroy();

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

  transferCard: async (req, res) => {
    const { id } = req.params;
    const { column_id } = req.body;
    const response = {};

    if (!column_id) {
      return res.status(400).json({ status: 400, message: "Bad request" });
    }

    try {
      const [mission, column] = await Promise.all([
        Mission.findByPk(id),
        Column.findByPk(column_id),
      ]);

      if (!column || !mission) {
        return res
          .status(404)
          .json({ status: 404, message: "Not found column or mission" });
      }

      const card = await Card.create({
        title: mission.name,
        endDateTime: mission.endDateTime,
        column_id: column_id,
        status: mission.status,
      });

      if (mission.user_id) {
        const user = await User.findByPk(mission.user_id);
        if (user) await card.addUser(user);
      }

      await column.update({ cardOrderIds: [...column.cardOrderIds, card.id] });
      await mission.destroy();

      const CardNew = await Card.findByPk(card.id, {
        include: {
          model: User,
          as: "users",
          attributes: { exclude: ["password"] }, // Loại trừ trường password
        },
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
        data: new CardTransformer(CardNew),
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
