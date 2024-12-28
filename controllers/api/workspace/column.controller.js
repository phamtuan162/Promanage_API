const {
  Card,
  Column,
  User,
  Board,
  Work,
  Mission,
  Activity,
  Attachment,
  Comment,
  UserCard,
} = require("../../../models/index");
const { object, string, date } = require("yup");
const { Op } = require("sequelize");
const ColumnTransformer = require("../../../transformers/workspace/column.transformer");
module.exports = {
  index: async (req, res) => {
    const { order = "asc", sort = "id", q, board_id } = req.query;
    const filters = {};
    if (board_id) {
      filters.board_id = board_id;
    }
    const options = {
      order: [[sort, order]],
      where: filters,
      include: {
        model: Card,
        as: "cards",
      },
    };
    const response = {};
    try {
      const columns = await Column.findAll(options);
      response.status = 200;
      response.message = "Success";
      response.data = new ColumnTransformer(columns);
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
      const column = await Column.findByPk(id, {
        include: {
          model: Card,
          as: "cards",
        },
      });
      if (!column) {
        Object.assign(response, {
          status: 404,
          message: "Not Found",
        });
      } else {
        Object.assign(response, {
          status: 200,
          message: "Success",
          data: new ColumnTransformer(column),
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

    if (req.body.board_id) {
      rules.board_id = string().required("Chưa có board_id");
    }

    const schema = object(rules);
    const response = {};
    try {
      const body = await schema.validate(req.body, {
        abortEarly: false,
      });
      const board = await Board.findByPk(req.body.board_id);

      if (!board) {
        return res
          .status(404)
          .json({ status: 404, message: "Not found board" });
      }

      const column = await Column.create(body);

      let updatedColumnOrderIds = [];

      if (board.columnOrderIds === null) {
        updatedColumnOrderIds = [column.id];
      } else {
        updatedColumnOrderIds = board.columnOrderIds.concat(column.id);
      }

      await board.update({
        columnOrderIds: updatedColumnOrderIds,
      });

      await Activity.create({
        user_id: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        column_id: column.id,
        title: column.title,
        action: "add_column",
        workspace_id: user.workspace_id_active,
        desc: `đã thêm danh sách ${column.title} vào bảng ${board.title}`,
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
        data: new ColumnTransformer(column),
      });
    } catch (e) {
      const errors = Array.isArray(e?.inner)
        ? Object.fromEntries(
            e.inner.map(({ path, message }) => [path, message])
          )
        : e;
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
      await Column.update(body, {
        where: { id },
      });
      const column = await Column.findByPk(id, {
        include: {
          model: Card,
          as: "cards",
          include: [
            { model: Comment, as: "comments" },
            { model: Attachment, as: "attachments" },
            {
              model: User,
              as: "users",
            },
            {
              model: Work,
              as: "works",
              include: { model: Mission, as: "missions" },
            },
          ],
        },
      });
      Object.assign(response, {
        status: 200,
        message: "Success",
        data: new ColumnTransformer(column),
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
      // Thực hiện tất cả các truy vấn song song
      const column = await Column.findByPk(id);

      if (!column) {
        return res
          .status(404)
          .json({ status: 404, message: "Column not found" });
      }

      const board = await Board.findByPk(column.board_id);

      if (!board) {
        return res
          .status(404)
          .json({ status: 404, message: "Board not found" });
      }

      const title = column.title;

      // Nếu có thẻ trong cột này, xóa liên kết với UserCard và xóa Card
      const cardIds = column?.cardOrderIds;
      if (cardIds?.length > 0 && cardIds?.length <= 10) {
        // Xóa liên kết Card
        await Card.update(
          { column_id: null, workspace_id: null }, // Dữ liệu cần cập nhật
          { where: { id: { [Op.in]: cardIds } } } // Điều kiện lọc
        );

        // Xóa liên kết UserCard
        await UserCard.destroy({
          where: { card_id: { [Op.in]: cardIds } },
          focus: true,
        });
      }

      // Xóa cột
      await column.update({ board_id: null });

      // Cập nhật danh sách columnOrderIds của board
      const columnOrderIdsUpdate = board.columnOrderIds.filter(
        (item) => +item !== +id
      );

      await board.update({ columnOrderIds: columnOrderIdsUpdate });

      // Tạo hoạt động cho hành động xóa cột
      await Activity.create({
        user_id: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        column_id: column.id,
        title: title,
        action: "delete_column",
        workspace_id: user.workspace_id_active,
        desc: `Đã xóa danh sách ${title} ra khỏi bảng ${board.title}`,
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
      });
    } catch (error) {
      console.error(error);

      Object.assign(response, {
        status: 500,
        message: "Server error",
      });
    }

    res.status(response.status).json(response);
  },

  moveCardDiffBoard: async (req, res) => {
    const { card_id, activeColumn, overColumn } = req.body;
    const response = {};

    if (!card_id || !overColumn.cardOrderIds || !activeColumn.cardOrderIds) {
      return res.status(400).json({ status: 400, message: "Bad request" });
    }

    try {
      const card = await Card.findByPk(card_id);

      if (!card) {
        return res.status(404).json({ status: 404, message: "Not found Card" });
      }

      const [columnOfActive, columnOfOver] = await Promise.all([
        Column.findByPk(activeColumn.id),
        Column.findByPk(overColumn.id),
      ]);

      if (!columnOfActive || !columnOfOver) {
        return res
          .status(404)
          .json({ status: 404, message: "Not found Column active or over" });
      }

      await card.update({ column_id: columnOfOver.id });

      await UserCard.destroy({
        where: {
          card_id: card.id,
        },
        force: true,
      });

      await Promise.all([
        columnOfActive.update({ cardOrderIds: activeColumn.cardOrderIds }),
        columnOfOver.update({ cardOrderIds: overColumn.cardOrderIds }),
      ]);

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

  moveColumnDiffBoard: async (req, res) => {
    const user = req.user.dataValues;
    const { id } = req.params;
    const { boardActive, boardOver, user_id } = req.body;
    const response = {};

    if (!boardActive.columnOrderIds || !boardOver.columnOrderIds || !user_id) {
      return res.status(400).json({ status: 400, message: "Bad request" });
    }

    try {
      const [column, BoardNew, BoardOld] = await Promise.all([
        Column.findByPk(id, {
          include: {
            model: Card,
            as: "cards",
            include: {
              model: Work,
              as: "works",
            },
          },
        }),
        Board.findByPk(boardOver.id),
        Board.findByPk(boardActive.id),
      ]);

      if (!column || !BoardNew || !BoardOld) {
        return res.status(404).json({
          status: 404,
          message: "Not Found column or board_new or board_old",
        });
      }

      await Promise.all([
        column.update({ board_id: BoardNew.id }),
        BoardOld.update({ columnOrderIds: boardActive.columnOrderIds }),
        BoardNew.update({ columnOrderIds: boardOver.columnOrderIds }),
      ]);

      if (column?.cards?.length > 0) {
        const cardIds = column.cards.map((c) => c.id);
        const workIds = column.cards.flatMap((c) => c.works.map((w) => w.id));

        if (BoardNew.workspace_id !== BoardOld.workspace_id) {
          await Card.update(
            { workspace_id: BoardNew.workspace_id },
            {
              where: { id: { [Op.in]: cardIds } },
            }
          );
          await UserCard.destroy({
            where: {
              card_id: { [Op.in]: cardIds },
            },
            force: true,
          });
        }

        if (workIds?.length > 0) {
          await Mission.update(
            { user_id: null },
            { where: { work_id: { [Op.in]: workIds } } }
          );
        }
      }

      const activity = await Activity.create({
        user_id: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        column_id: column.id,
        title: column.title,
        action: "add_column",
        workspace_id: user.workspace_id_active,
        desc: `đã di chuyển danh sách ${column.title} của bảng ${BoardOld.title} sang bảng ${BoardNew.title}`,
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
        activity,
      });
    } catch (error) {
      Object.assign(response, {
        status: 500,
        message: "Sever error",
      });
    }

    res.status(response.status).json(response);
  },

  copyColumn: async (req, res) => {
    const user = req.user.dataValues;
    const { column, board_id, title } = req.body;
    const response = {};
    let transaction;
    if (!column || !board_id) {
      return res.status(400).json({ status: 400, message: "Bad request" });
    }
    try {
      const [BoardActive, columnActive] = await Promise.all([
        Board.findByPk(board_id),
        Column.findByPk(column.id),
      ]);

      if (!BoardActive || !columnActive) {
        return res
          .status(404)
          .json({ status: 404, message: "Not Found board or column" });
      }

      const columnNew = await Column.create({
        title: title,
        board_id: board_id,
        order: column.order,
      });

      const newColumnOrderIds = [columnNew.id, ...BoardActive.columnOrderIds];

      await Activity.create({
        user_id: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        column_id: columnNew.id,
        title: title,
        action: "add_column",
        workspace_id: user.workspace_id_active,
        desc: `đã thêm danh sách ${title} vào bảng ${BoardActive.title}`,
      });
      if (column?.cards?.length > 0) {
        let cardOrderIdsNew = [];

        for (const card of column.cards) {
          const cardNew = await Card.create({
            column_id: columnNew.id,
            title: card.title,
            desc: card.desc,
            background: card.background,
            startDateTime: card.startDateTime,
            endDateTime: card.endDateTime,
            status: card.status,
          });
          await Activity.create({
            user_id: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            card_id: cardNew.id,
            title: cardNew.title,
            action: "copy_card",
            workspace_id: user.workspace_id_active,
            desc: `đã sao chép thẻ này từ ${card.title} trong danh sách ${column.title}`,
          });

          cardOrderIdsNew.push(cardNew.id);
          if (card?.users?.length > 0) {
            card.users.sort((a, b) =>
              a === user.id ? -1 : b === user.id ? 1 : 0
            );
            for (const userCopy of card.users) {
              const userInstance = await User.findByPk(userCopy.id);
              if (userInstance) {
                await cardNew.addUser(userInstance);
                await Activity.create({
                  user_id: user.id,
                  userName: user.name,
                  userAvatar: user.avatar,
                  card_id: cardNew.id,
                  title: cardNew.title,
                  action: "assign_user",
                  workspace_id: user.workspace_id_active,
                  desc:
                    +userInstance.id === +user.id
                      ? ` đã tham gia thẻ này`
                      : ` đã thêm ${userInstance.name} vào thẻ này`,
                });
              }
            }
          }

          if (card?.works?.length > 0) {
            for (const work of card.works) {
              const workNew = await Work.create(
                {
                  title: work.title,
                  card_id: cardNew.id,
                },
                { transaction }
              );

              if (work?.missions?.length > 0) {
                for (const mission of work.missions) {
                  await Mission.create({
                    name: mission.name,
                    work_id: workNew.id,
                    user_id: mission.user_id,
                    status: mission.status,
                    endDateTime: mission.endDateTime,
                  });
                }
              }
            }
          }

          if (card?.attachments?.length > 0) {
            for (const attachment of card.attachments) {
              await Attachment.create({
                fileName: attachment.fileName,
                path: attachment.path,
                created_at: attachment.created_at,
                updated_at: attachment.updated_at,
                card_id: cardNew.id,
                user_id: attachment.user_id,
              });
            }
          }

          if (card?.comments?.length > 0) {
            for (const comment of card.comments) {
              await Comment.create({
                isEdit: comment.isEdit,
                userName: comment.userName,
                userAvatar: comment.userAvatar,
                user_id: comment.user_id,
                card_id: cardNew.id,
                content: comment.content,
              });
            }
          }
        }
        await columnNew.update({ cardOrderIds: cardOrderIdsNew });
      }
      await BoardActive.update({
        columnOrderIds: newColumnOrderIds,
      });

      const columnUpdate = await Column.findByPk(columnNew.id, {
        include: {
          model: Card,
          as: "cards",
          include: [
            { model: Comment, as: "comments" },
            { model: Attachment, as: "attachments" },
            {
              model: User,
              as: "users",
            },
            {
              model: Work,
              as: "works",
              include: { model: Mission, as: "missions" },
            },
          ],
        },
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
        data: columnUpdate,
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
