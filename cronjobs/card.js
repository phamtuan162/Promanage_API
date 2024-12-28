const {
  Card,
  User,
  Column,
  Board,
  Workspace,
  Comment,
  Attachment,
  Work,
  Mission,
  Activity,
  UserCard,
} = require("../models/index");
const { isAfter, subDays, isBefore, subHours } = require("date-fns");
const sendMail = require("../utils/mail");
const { Op } = require("sequelize");
const batchSize = 10;

module.exports = {
  HandleExpired: async () => {
    try {
      let offset = 0;
      while (true) {
        const cards = await Card.findAll({
          include: [
            {
              model: User,
              as: "users",
              attributes: ["email"], // Chỉ lấy email
              require: false,
              where: {
                email: { [Op.not]: null }, // Chỉ lấy người dùng có email
              },
            },
            {
              model: Workspace,
              as: "workspace",
            },
            {
              model: Column,
              as: "column",
              require: false,
              where: {
                board_id: { [Op.not]: null }, // board_id không null
              },
              include: {
                model: Board,
                as: "board",
              },
            },
          ],
          where: {
            endDateTime: { [Op.not]: null }, // endDateTime không null
            column_id: { [Op.not]: null }, // column_id không null
            workspace_id: { [Op.not]: null }, // column_id không null
          },
          limit: batchSize,
          offset: offset,
        });

        if (cards.length === 0) {
          break; // Không còn cột nào, dừng vòng lặp
        }

        if (cards.length > 0) {
          for (const card of cards) {
            if (!card?.workspace || !card?.column?.board) {
              continue;
            }
            const currentTime = new Date();
            const oneDayBeforeEnd = subDays(card.endDateTime, 1);
            const oneHourBeforeEnd = subHours(currentTime, 1);
            const workspace = card.workspace;
            const board = card.column.board;
            const link = `http://localhost:3000/w/${workspace.id}`;

            if (
              isBefore(oneHourBeforeEnd, card.endDateTime) &&
              isAfter(currentTime, card.endDateTime)
            ) {
              await card.update({ status: "expired" });
              // Gửi thông báo  hết hạn
              if (card?.users?.length > 0) {
                const html = `<p>Thẻ <b>${card.title}</b> của bạn trong Bảng làm việc <b>${board.title}</b> thuộc Không gian làm việc <a href=${link}>${workspace.name}</a> <span style="color:red">đã hết hạn</span>!</p>`;

                await Promise.all(
                  card.users.map((user) => {
                    return sendMail(user.email, "Thông báo thẻ hết hạn", html);
                  })
                );
              }
            } else if (
              isAfter(currentTime, oneDayBeforeEnd) &&
              isBefore(currentTime, card.endDateTime)
            ) {
              await card.update({ status: "up_expired" });
              // Gửi thông báo sắp hết hạn
              if (card?.users?.length > 0) {
                const html = `<p>Thẻ <b>${card.title}</b> của bạn trong Bảng làm việc <b>${board.title}</b> thuộc Không gian làm việc <a href=${link}>${workspace.name}</a> <span style="color:yellow">sắp hết hạn</span>!</p>`;
                await Promise.all(
                  card.users.map((user) => {
                    return sendMail(
                      user.email,
                      "Thông báo thẻ sắp hết hạn",
                      html
                    );
                  })
                );
              }
            }
          }
        }

        offset += batchSize;
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  delete: async () => {
    let offset = 0;
    try {
      while (true) {
        const cards = await Card.findAll({
          include: [
            {
              model: Work,
              as: "works",
              include: { model: Mission, as: "missions" },
            },
          ],
          paranoid: false,
          where: {
            [Op.or]: [
              { deleted_at: { [Op.ne]: null } }, // Bị xóa mềm
              { column_id: null }, // Hoặc column_id = null
            ],
          },
          order: [["deleted_at", "desc"]], // Sắp xếp giảm dần theo deleted_at
          limit: batchSize,
          offset: offset,
        });

        if (cards?.length === 0) {
          break; // Không còn cột nào, dừng vòng lặp
        }

        // Xóa cards vĩnh viễn

        for (const card of cards) {
          await Promise.all([
            UserCard.destroy({
              where: { card_id: card.id },
              force: true,
            }),

            Comment.destroy({ where: { card_id: card.id } }),

            Attachment.destroy({ where: { card_id: card.id } }),

            Activity.update({ card_id: null }, { where: { card_id: card.id } }),
          ]);

          if (card?.works?.length > 0) {
            const workIds = card.works.map((work) => work.id);
            await Mission.destroy({ where: { work_id: { [Op.in]: workIds } } });
            await Work.destroy({ where: { id: { [Op.in]: workIds } } });
          }

          await card.destroy({ force: true });
        }
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
};
