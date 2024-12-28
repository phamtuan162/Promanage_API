const {
  Workspace,
  Board,
  Column,
  Card,
  User,
  Work,
  Mission,
  Activity,
  Attachment,
  Comment,
} = require("../../../models/index");
const { object, string } = require("yup");
const { Op } = require("sequelize");
const BoardTransformer = require("../../../transformers/workspace/board.transformer");

module.exports = {
  index: async (req, res) => {
    const {
      order = "desc",
      sort = "updated_at",
      status,
      workspace_id,
      q,
    } = req.query;
    const filters = {};
    if (status) {
      filters.status = status;
    }
    if (workspace_id) {
      filters.workspace_id = workspace_id;
    }
    const options = {
      paranoid: true,
      order: [[sort, order]],
      where: filters,
      include: {
        model: Column,
        as: "columns",
        include: {
          model: Card,
          as: "cards",
        },
      },
    };
    const response = {};
    try {
      const boards = await Board.findAll(options);
      response.status = 200;
      response.message = "Success";
      response.data = new BoardTransformer(boards);
    } catch (e) {
      response.status = 500;
      response.message = "Server error";
    }

    res.status(response.status).json(response);
  },

  find: async (req, res) => {
    const { isDetailCard = "true", isCard = "true" } = req.query;
    const { id } = req.params;

    try {
      const includeColumn = isCard === "true";
      const includeCard =
        isDetailCard === "true"
          ? [
              { model: Comment, as: "comments" },
              { model: Attachment, as: "attachments" },
              { model: Activity, as: "activities" },
              {
                model: User,
                as: "users",
                attributes: { exclude: ["password"] },
              },
              { model: Column, as: "column" },
              {
                model: Work,
                as: "works",
                include: {
                  model: Mission,
                  as: "missions",
                  include: {
                    model: User,
                    as: "user",
                    attributes: { exclude: ["password"] },
                  },
                },
              },
            ]
          : [];

      const board = await Board.findByPk(id, {
        include: {
          model: Column,
          as: "columns",
          include: includeColumn
            ? {
                model: Card,
                as: "cards",
                include: includeCard,
              }
            : [],
        },
      });

      if (!board) {
        return res
          .status(404)
          .json({ status: 404, message: "Not Found Board" });
      }

      res.status(200).json({
        status: 200,
        message: "Success",
        data: new BoardTransformer(board),
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ status: 500, message: "Server Error" });
    }
  },

  store: async (req, res) => {
    const user = req.user.dataValues;
    const rules = {};

    if (req.body.title) {
      rules.title = string().required("Chưa nhập tiêu đề");
    }

    if (req.body.status) {
      rules.status = string().required("Chọn trạng thái");
    }

    const schema = object(rules);

    const response = {};
    try {
      const body = await schema.validate(req.body, {
        abortEarly: false,
      });
      const board = await Board.create({ ...body, status: "public" });
      const activity = await Activity.create({
        user_id: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        board_id: board.id,
        title: board.title,
        action: "add_board",
        workspace_id: user.workspace_id_active,
        desc: `đã thêm bảng ${board.title} vào Không gian làm việc này`,
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
        data: new BoardTransformer(board),
        activity: activity,
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
    const method = req.method;
    const rules = {};

    if (req.body.title) {
      rules.title = string().required("Chưa nhập tiêu đề");
    }
    if (req.body.status) {
      rules.status = string().required("Chọn trạng thái");
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
      await Board.update(body, {
        where: { id },
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
      });
    } catch (e) {
      const errors = Object.fromEntries(
        e?.inner?.map(({ path, message }) => [path, message])
      );
      Object.assign(response, {
        status: 400,
        message: "Bad Request",
        errors,
      });
    }
    res.status(response.status).json(response);
  },

  moveCard: async (req, res) => {
    const user = req.user.dataValues;
    const { nextColumn: nextColumnNew, card_id, prevColumnId } = req.body;
    const response = {};

    // Kiểm tra các dữ liệu nhận được
    if (!nextColumnNew.cardOrderIds || !card_id || !prevColumnId) {
      return res.status(400).json({ status: 400, message: "Bad request" });
    }

    try {
      const [cardCurrent, nextColumn, prevColumn] = await Promise.all([
        Card.findByPk(card_id),
        Column.findByPk(nextColumnNew.id),
        Column.findByPk(prevColumnId),
      ]);

      // Kiểm tra các dữ liệu nhận được
      if (!cardCurrent || !nextColumn || !prevColumn) {
        return res.status(404).json({ status: 404, message: "Not found" });
      }

      // Chuyển cardOrderIds thành Set để cải thiện tốc độ kiểm tra
      const nextColumnCardOrderIdsSet = new Set(nextColumn.cardOrderIds);
      const prevColumnCardOrderIdsSet = new Set(prevColumn.cardOrderIds);

      // Kiểm tra xem card đã tồn tại trong cột tiếp theo hay không
      if (nextColumnCardOrderIdsSet.has(+card_id)) {
        return res.status(400).json({
          status: 400,
          message: "Card already exists in the next column",
        });
      }

      // Kiểm tra xem card có tồn tại trong cột trước hay không
      if (!prevColumnCardOrderIdsSet.has(+card_id)) {
        return res.status(400).json({
          status: 400,
          message: "Card does not exist in the previous column",
        });
      }

      // Loại card_id di chuyển ra khỏi cardOrderIds của cột trước
      const prevCardOrderIds = prevColumn.cardOrderIds.filter(
        (c) => +c !== card_id
      );

      await Promise.all([
        // Cập nhật cardOrderIds của cột trước (prevColumn)
        Column.update(
          {
            cardOrderIds: prevCardOrderIds,
          },
          { where: { id: prevColumnId } }
        ),
        // Cập nhật cardOrderIds của cột tiếp theo (nextColumn)
        Column.update(
          { cardOrderIds: nextColumnNew.cardOrderIds },
          { where: { id: nextColumnNew.id } }
        ),
        // Cập nhật column_id của thẻ di chuyển
        Card.update(
          { column_id: nextColumnNew.id },
          { where: { id: card_id } }
        ),
      ]);

      // Tạo thông báo hành động di chuyên thẻ
      const activity = await Activity.create({
        user_id: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        card_id: cardCurrent.id,
        title: cardCurrent.title,
        action: "move_card",
        workspace_id: user.workspace_id_active,
        desc: `đã di chuyển thẻ này từ danh sách ${prevColumn.title} tới danh sách ${nextColumn.title}`,
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
        activity,
      });
    } catch (e) {
      Object.assign(response, {
        status: 500,
        message: "Server error",
      });
    }
    res.status(response.status).json(response);
  },

  delete: async (req, res) => {
    const user = req.user.dataValues;
    const { id } = req.params;
    const response = {};

    try {
      const board = await Board.findByPk(id, {
        include: { model: Column, as: "columns" },
      });

      if (!board) {
        return res
          .status(404)
          .json({ status: 404, message: "Not found board" });
      }

      const { title } = board;

      // Nếu trong board có column thì xóa mềm
      if (board.columns.length > 0) {
        await board.destroy();
      }
      // Nếu trong board không có column thì xóa hẳn
      else {
        await Activity.update({ board_id: null }, { where: { board_id: id } });
        await board.destroy({ force: true });
      }

      const activity = await Activity.create({
        user_id: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        title: title,
        action: "delete_board",
        workspace_id: user.workspace_id_active,
        desc: `đã xóa bảng ${title} ra khỏi Không gian làm việc này`,
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
        activity,
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
