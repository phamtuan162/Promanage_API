const {
  Mission,
  User,
  Card,
  Board,
  Workspace,
  Column,
  Work,
} = require("../models/index");
const {
  isAfter,
  subDays,
  isBefore,
  subHours,
  formatDistanceToNow,
} = require("date-fns");
const vi = require("date-fns/locale/vi");
const sendMail = require("../utils/mail");
const { Op } = require("sequelize");
const batchSize = 10;

module.exports = {
  HandleExpired: async () => {
    let offset = 0;
    while (true) {
      const missions = await Mission.findAll({
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "email"], // Chỉ lấy email
            require: false,
            where: {
              email: { [Op.not]: null }, // Chỉ lấy người dùng có email
            },
          },
          {
            model: Work,
            as: "work",
            attributes: ["id", "card_id"],
            include: {
              model: Card,
              as: "card",
              attributes: ["id", "workspace_id", "column_id"],
              include: [
                {
                  model: Column,
                  as: "column",
                  attributes: ["id", "board_id"],
                  include: {
                    model: Board,
                    as: "board",
                    attributes: ["id", "title"],
                  },
                },
                {
                  model: Workspace,
                  as: "workspace",
                  attributes: ["id", "name"],
                },
              ],
            },
          },
        ],
        where: {
          endDateTime: { [Op.not]: null }, // endDateTime không null
          work_id: { [Op.not]: null }, // work_id không null
          user_id: { [Op.not]: null }, // user_id không null
          status: { [Op.ne]: "expired" }, // Loại bỏ mission có trạng thái là 'expired'
        },
        limit: batchSize,
        offset: offset,
      });

      if (missions?.length === 0) break;

      for (const mission of missions) {
        if (
          !mission?.user || // Không có user
          !mission?.work?.card?.column?.board || // Không có board liên kết
          !mission?.work?.card?.workspace // Không có workspace liên kết
        ) {
          continue; // Bỏ qua nếu không thỏa mãn
        }

        const currentTime = new Date();
        const oneDayBeforeEnd = subDays(mission.endDateTime, 1);
        const oneHourBeforeEnd = subHours(currentTime, 1);

        const workspace = mission.card.workspace;
        const board = mission.card.column.board;

        const link = `http://localhost:3000/w/${workspace.id}`;

        if (
          isBefore(oneHourBeforeEnd, mission.endDateTime) &&
          isAfter(currentTime, mission.endDateTime)
        ) {
          await mission.update({ status: "expired" });

          const html = `<p>Công việc <b> ${mission.name}</b> của bạn trong Bảng làm việc <b>${board.title}</b>  thuộc Không gian làm việc <a href="${link}">${workspace.name}</a> <span style="color:red">đã hết hạn</span>!</p>`;
          sendMail(mission.user.email, "Thông báo công việc hết hạn", html);
        } else if (
          isAfter(currentTime, oneDayBeforeEnd) &&
          isBefore(currentTime, mission.endDateTime)
        ) {
          await mission.update({ status: "up_expired" });
          const html = `<p>Công việc <b>${
            mission.name
          }</b> của bạn trong Bảng làm việc <b>${
            board.title
          }</b> thuộc Không gian làm việc <a href="${link}">${
            workspace.name
          }</a> <span style="color:yellow">sắp hết hạn ${formatDistanceToNow(
            new Date(mission.endDateTime),
            { addSuffix: true, locale: vi }
          )}</span>!</p>`;
          await sendMail(
            mission.user.email,
            "Thông báo công việc sắp hết hạn",
            html
          );
        }
      }

      offset += batchSize;
    }
  },
};
