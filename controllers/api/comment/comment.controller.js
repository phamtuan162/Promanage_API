const { Comment, User, Card } = require("../../../models/index");
const { object, string } = require("yup");

module.exports = {
  index: async (req, res) => {
    const { order = "desc", sort = "created_at", card_id, user_id } = req.query;
    const filters = {};
    if (card_id) {
      filters.card_id = card_id;
    }
    if (user_id) {
      filters.user_id = user_id;
    }
    const options = {
      order: [[sort, order]],
      where: filters,
    };
    const response = {};
    try {
      const comments = await Comment.findAll(options);
      response.status = 200;
      response.message = "Success";
      response.data = comments;
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
      const comment = await Comment.findByPk(id);
      if (!comment) {
        Object.assign(response, {
          status: 404,
          message: "Not Found",
        });
      } else {
        Object.assign(response, {
          status: 200,
          message: "Success",
          data: comment,
        });
      }
    } catch (e) {
      response.status = 500;
      response.message = "Server Error";
    }
    res.status(response.status).json(response);
  },
  store: async (req, res) => {
    const rules = {};

    if (req.body.content) {
      rules.content = string().required("Chưa nhập nội dung bình luận");
    }

    const schema = object(rules);
    const response = {};
    try {
      const body = await schema.validate(req.body, {
        abortEarly: false,
      });

      const [user, card] = await Promise.all([
        User.findByPk(body.user_id),
        Card.findByPk(body.card_id),
      ]);

      if (!user || !card) {
        return res
          .status(404)
          .json({ status: 404, message: "Not found card or user" });
      }

      const comment = await Comment.create({
        content: body.content,
        user_id: user.id,
        card_id: card.id,
        isEdit: false,
        userName: user.name,
        userAvatar: user.avatar,
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
        data: comment,
      });
    } catch (e) {
      console.log(e);
      const errors = e.inner
        ? Object.fromEntries(
            e.inner.map(({ path, message }) => [path, message])
          )
        : {};

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
    const rules = {};

    if (req.body.content) {
      rules.content = string()
        .required("Chưa nhập nội dung bình luận")
        .max(200, "Nội dung bình luận phải có nhiều nhất 200 ký tự");
    }

    const schema = object(rules);
    const response = {};
    try {
      const body = await schema.validate(req.body, {
        abortEarly: false,
      });

      const comment = await Comment.findByPk(id);

      if (!comment) {
        return res.status(404).json({ status: 404, message: "Not found" });
      }

      await comment.update({ ...body, isEdit: true });

      Object.assign(response, {
        status: 200,
        message: "Success",
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
      const comment = await Comment.findByPk(id);

      if (!comment) {
        return res
          .status(404)
          .json({ status: 404, message: "Not found comment" });
      }
      await comment.destroy();

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
