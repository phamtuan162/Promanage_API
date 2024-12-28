const {
  Board,
  Card,
  Column,
  User,
  Work,
  Mission,
  Activity,
  Attachment,
  Workspace,
  Comment,
  UserCard,
  Notification,
} = require("../../../models/index");
const { object, string } = require("yup");
const CardTransformer = require("../../../transformers/workspace/card.transformer");
const { format } = require("date-fns");
const { getFileType } = require("../../../utils/getFileType");
const { streamUploadFile } = require("../../../utils/cloudinary");
const { extractErrors } = require("../../../utils/errorUtils");
module.exports = {
  index: async (req, res) => {
    const { order = "asc", sort = "id", q, column_id } = req.query;
    const filters = {};
    if (column_id) {
      filters.column_id = column_id;
    }
    const options = {
      order: [[sort, order]],
      where: filters,
    };
    const response = {};
    try {
      const cards = await Card.findAll(options);
      response.status = 200;
      response.message = "Success";
      response.data = new CardTransformer(cards);
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
      const card = await Card.findByPk(id, {
        include: [
          { model: Comment, as: "comments" },
          { model: Attachment, as: "attachments" },
          { model: Activity, as: "activities" },
          {
            model: User,
            as: "users",
            attributes: { exclude: ["password"] }, // Loại trừ trường password
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
                attributes: { exclude: ["password"] }, // Loại trừ trường password
              },
            },
          },
        ],
      });
      if (!card) {
        Object.assign(response, {
          status: 404,
          message: "Not Found",
        });
      } else {
        Object.assign(response, {
          status: 200,
          message: "Success",
          data: new CardTransformer(card),
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
      const [column, workspace] = await Promise.all([
        Column.findByPk(req.body.column_id),
        Workspace.findByPk(req.body.workspace_id),
      ]);

      if (!column || !workspace) {
        return res
          .status(404)
          .json({ status: 404, message: "Not found column or workspace" });
      }

      const card = await Card.create(body);

      let updatedCardOrderIds = [];

      if (column.cardOrderIds === null) {
        updatedCardOrderIds = [card.id];
      } else {
        updatedCardOrderIds = column.cardOrderIds.concat(card.id);
      }

      await column.update({
        cardOrderIds: updatedCardOrderIds,
      });

      await Activity.create({
        user_id: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        card_id: card.id,
        title: card.title,
        action: "create",
        workspace_id: user.workspace_id_active,
        desc: `vào danh sách ${column.title}`,
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
        data: new CardTransformer(card),
      });
    } catch (e) {
      const errors = Object.fromEntries(
        e?.inner.map(({ path, message }) => [path, message])
      );
      console.log(e);
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
    const method = req.method;
    const file = req.file;

    const rules = {};

    if (req.body.title) {
      rules.title = string().required("Chưa nhập tiêu đề");
    }

    const schema = object(rules);
    const response = {};
    try {
      let body = await schema.validate(req.body, {
        abortEarly: false,
      });
      const card = await Card.findByPk(id);

      if (!card) {
        return res.status(404).json({ status: 404, message: "Not found card" });
      }

      if (file) {
        const resultUpload = await streamUploadFile(file.buffer, "cardCovers");
        await card.update({ background: resultUpload.secure_url });
      } else {
        await card.update(body);
      }

      if (req.body.status) {
        await Activity.create({
          user_id: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          card_id: id,
          title: card.title,
          action: "status_card",
          workspace_id: user.workspace_id_active,
          desc:
            req.body.status.toLowerCase() === "success"
              ? "đã đánh dấu ngày hết hạn là hoàn thành"
              : "đã đánh dấu ngày hết hạn là chưa hoàn thành",
        });
      }

      const cardUpdate = await Card.findByPk(id, {
        include: [
          { model: User, as: "users" },
          { model: Activity, as: "activities" },
        ],
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
        data: new CardTransformer(cardUpdate),
      });
    } catch (e) {
      console.log(e);

      const errors = extractErrors(e);
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
      const card = await Card.findByPk(id);

      if (!card) {
        return res
          .status(404)
          .json({ status: 404, message: "Not found card " });
      }

      const column = await Column.findByPk(card.column_id);

      if (!column) {
        return res
          .status(404)
          .json({ status: 404, message: "Not found column" });
      }

      const board = await Column.findByPk(column.board_id);

      if (!board) {
        return res
          .status(404)
          .json({ status: 404, message: "Not found board" });
      }

      const { title } = card;

      await UserCard.destroy({
        where: {
          card_id: card.id,
        },
        force: true,
      });

      await card.destroy();

      const activity = await Activity.create({
        user_id: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        title: title,
        action: "delete_card",
        column_id: column.id,
        workspace_id: user.workspace_id_active,
        desc: `đã xóa thẻ ${card.title} khỏi danh sách ${column.title} trong bảng ${board.title}`,
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
  assignUser: async (req, res) => {
    const userMain = req.user.dataValues;
    const { id } = req.params;
    const { user_id, notification } = req.body;
    const response = {};

    if (!user_id || !notification) {
      return res.status(400).json({ status: 400, message: "Bad request" });
    }

    const [card, user] = await Promise.all([
      Card.findByPk(id),
      User.findByPk(user_id),
    ]);

    if (!user || !card) {
      return res
        .status(404)
        .json({ status: 404, message: "Not found user or card" });
    }

    await card.addUser(user);

    const activity = await Activity.create({
      user_id: userMain.id,
      userName: userMain.name,
      userAvatar: userMain.avatar,
      card_id: card.id,
      title: card.title,
      action: "assign_user",
      workspace_id: userMain.workspace_id_active,
      desc:
        +userMain.id === +user_id ? `đã tham gia` : `đã thêm ${user.name} vào`,
    });

    const notificationNew =
      +userMain.id === +notification?.user_id
        ? await Notification.create(notification)
        : null;

    Object.assign(response, {
      status: 200,
      message: "Success",
      activity,
      notification: notificationNew,
    });
    res.status(response.status).json(response);
  },
  unAssignUser: async (req, res) => {
    const userMain = req.user.dataValues;
    const { id } = req.params;
    const { user_id, notification } = req.body;
    const response = {};

    if (!user_id || !notification) {
      return res.status(400).json({ status: 400, message: "Bad request" });
    }

    try {
      const [card, user] = await Promise.all([
        Card.findByPk(id),
        User.findByPk(user_id),
      ]);

      if (!user || !card) {
        return res
          .status(404)
          .json({ status: 404, message: "Not found user or card" });
      }

      await card.removeUser(user);

      const activity = await Activity.create({
        user_id: userMain.id,
        userName: userMain.name,
        userAvatar: userMain.avatar,
        card_id: card.id,
        title: card.title,
        action: "un_assign_user",
        workspace_id: userMain.workspace_id_active,
        desc:
          +userMain.id === +user_id
            ? `đã rời khỏi`
            : `đã loại ${user.name} khỏi`,
      });

      const notificationNew =
        +userMain.id === +notification?.user_id
          ? await Notification.create(notification)
          : null;

      Object.assign(response, {
        status: 200,
        message: "Success",
        activity,
        notification: notificationNew,
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
  copyCard: async (req, res) => {
    const user = req.user.dataValues;
    const { keptItems, matchBoard, overColumn, card } = req.body;
    const response = {};

    if (!overColumn.cardOrderIds || !card) {
      return res.status(400).json({ status: 400, message: "Bad request" });
    }

    try {
      const column = await Column.findByPk(overColumn.id);

      if (!column) {
        return res
          .status(404)
          .json({ status: 404, message: "Not found column" });
      }

      const cardNew = await Card.create({
        workspace_id: card.workspace_id,
        column_id: card.column_id,
        title: card.title,
        desc: card.desc,
        background: card.background,
        startDateTime: card.startDateTime,
        endDateTime: card.endDateTime,
        status: "pending",
      });

      if (cardNew && keptItems.length > 0) {
        await Promise.all(
          keptItems.map(async (keptItem) => {
            const itemType = keptItem.toLowerCase().trim();
            switch (itemType) {
              case "users":
                const usersToAdd = matchBoard
                  ? card.users
                  : card.users.filter((u) => u === user.id);

                if (usersToAdd?.length > 0) {
                  const usersInstance = await Promise.all(
                    usersToAdd.map(async ({ id, name }) => {
                      const userInstance = await User.findByPk(id);

                      return userInstance;
                    })
                  );
                  await cardNew.addUsers(usersInstance);

                  await Promise.all(
                    usersToAdd.map(async ({ id, name }) => {
                      const activity = await Activity.create({
                        user_id: user.id,
                        userName: user.name,
                        userAvatar: user.avatar,
                        card_id: cardNew.id,
                        title: cardNew.title,
                        action: "assign_user",
                        workspace_id: user.workspace_id_active,
                        desc:
                          +id === +user.id
                            ? "đã tham gia thẻ này"
                            : `đã thêm ${name} vào thẻ này`,
                      });
                      return activity;
                    })
                  );
                }

                break;
              case "works":
                await Promise.all(
                  card.works.map(async (work) => {
                    const workNew = await Work.create({
                      title: work.title,
                      card_id: cardNew.id,
                    });
                    if (work.missions.length > 0) {
                      await Promise.all(
                        work.missions.map(async (mission) => {
                          const missionNew = await Mission.create({
                            name: mission.name,
                            work_id: workNew.id,
                            workspace_id: mission.workspace_id,
                            user_id: matchBoard ? mission.user_id : null,
                            status: "pending",
                            endDateTime: mission.endDateTime,
                          });
                          return missionNew;
                        })
                      );
                    }
                    return workNew;
                  })
                );
                break;
              case "attachments":
                await Promise.all(
                  card.attachments.map(async (attachment) => {
                    const attachmentNew = await Attachment.create({
                      fileName: attachment.fileName,
                      path: attachment.path,
                      card_id: cardNew.id,
                      user_id: attachment.user_id,
                    });

                    return attachmentNew;
                  })
                );
                break;
              case "comments":
                await Promise.all(
                  card.comments.map(async (comment) => {
                    const commentInstance = await Comment.create({
                      isEdit: comment.isEdit,
                      userName: comment.userName,
                      userAvatar: comment.userAvatar,
                      user_id: comment.user_id,
                      card_id: cardNew.id,
                      content: comment.content,
                    });
                    return commentInstance;
                  })
                );
                break;
              default:
                // Xử lý các trường hợp khác nếu cần
                break;
            }
          })
        );
      }

      const cardOrderIds = overColumn.cardOrderIds.map((id) =>
        id === card.id ? cardNew.id : id
      );

      await column.update({ cardOrderIds: cardOrderIds });

      const oldColumn =
        +card.column_id === +overColumn.id
          ? overColumn
          : await Column.findByPk(card.column_id);

      const board = !matchBoard && (await Board.findByPk(overColumn.board_id));

      await Activity.create({
        user_id: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        card_id: cardNew.id,
        title: cardNew.title,
        action: "copy_card",
        workspace_id: user.workspace_id_active,
        desc: `đã sao chép thẻ này từ ${card.title} trong danh sách ${
          oldColumn.title
        } ${!matchBoard ? `của bảng ${board.title}` : ""}`,
      });

      const cardCopy = await Card.findByPk(cardNew.id, {
        include: [
          { model: Comment, as: "comments" },
          { model: Attachment, as: "attachments" },
          { model: Activity, as: "activities" },
          {
            model: User,
            as: "users",
            attributes: { exclude: ["password"] }, // Loại trừ trường password
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
                attributes: { exclude: ["password"] }, // Loại trừ trường password
              },
            },
          },
        ],
      });
      Object.assign(response, {
        status: 200,
        message: "Success",
        data: cardCopy,
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

  dateCard: async (req, res) => {
    const user = req.user.dataValues;
    const { id } = req.params;
    const { endDateTime, startDateTime } = req.body;

    const response = {};
    try {
      const card = await Card.findByPk(id);

      if (!card) {
        return res.status(404).json({ status: 404, message: "Not found" });
      }

      await card.update(req.body);

      let activity = null;
      if (endDateTime) {
        const endDateTimeUpdate = format(
          new Date(card.endDateTime),
          "'Ngày' d 'tháng' M 'lúc' H:mm"
        );

        activity = await Activity.create({
          user_id: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          card_id: card.id,
          title: card.title,
          action: "date_card",
          workspace_id: user.workspace_id_active,
          desc: card.endDateTime
            ? `đã chuyển ngày hết hạn thẻ ${card.title} sang ${endDateTimeUpdate}`
            : `đã đặt ngày hết hạn cho thẻ ${card.title} là ${endDateTimeUpdate}`,
        });
      }
      if (endDateTime === null) {
        activity = await Activity.create({
          user_id: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          card_id: card.id,
          title: card.title,
          action: "date_card",
          workspace_id: user.workspace_id_active,
          desc: `đã bỏ ngày hết hạn của thẻ này`,
        });
      }

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

  uploads: async (req, res) => {
    const { id } = req.params;
    const user = req.user.dataValues;
    const file = req.file;
    const response = {};

    if (!file) {
      return res.status(400).json({ status: 400, message: "Bad request" });
    }

    try {
      const card = await Card.findByPk(id);

      if (!card) {
        return res.status(404).json({ status: 404, message: "Not found card" });
      }

      const fileType = getFileType(file.originalname);

      const resultUpload = await streamUploadFile(
        file.buffer,
        "attachmentFiles",
        fileType
      );

      const attachment = await Attachment.create({
        user_id: user.id,
        path: resultUpload.secure_url,
        card_id: card.id,
        fileName: file.originalname,
      });

      const activity = await Activity.create({
        user_id: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        card_id: card.id,
        title: card.title,
        action: "attachment_file",
        workspace_id: user.workspace_id_active,
        desc: `đã đính kèm tập tin ${resultUpload.name} vào thẻ này`,
      });

      Object.assign(response, {
        status: 200,
        message: "Success",
        attachment,
        activity,
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
};
