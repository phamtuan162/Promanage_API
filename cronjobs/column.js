const { Op } = require("sequelize");
const { Column, Card, Activity } = require("../models/index");
const batchSize = 5;

module.exports = {
  delete: async () => {
    try {
      let offset = 0;

      while (true) {
        // Lấy các cột cần xử lý
        const columns = await Column.findAll({
          paranoid: false,
          where: {
            [Op.or]: [
              { deleted_at: { [Op.ne]: null } }, // Bị xóa mềm
              { board_id: null }, // Hoặc board_id = null
            ],
          },
          order: [["deleted_at", "desc"]], // Sắp xếp giảm dần theo deleted_at
          limit: batchSize,
          offset: offset, // Điều chỉnh offset sau mỗi lần lặp
        });

        if (columns.length === 0) {
          break; // Không còn cột nào, dừng vòng lặp
        }

        const columnIds = columns.map((c) => c.id);

        // Sử dụng Promise.all để chạy song song
        await Promise.all([
          Card.update(
            { column_id: null },
            { where: { column_id: { [Op.in]: columnIds } } }
          ),
          Activity.update(
            { column_id: null },
            { where: { column_id: { [Op.in]: columnIds } } }
          ),
        ]);

        // Xóa column vĩnh viễn
        await Column.destroy({
          where: { id: { [Op.in]: columnIds } },
          force: true,
        });

        // Tăng offset để lấy batch tiếp theo
        offset += batchSize;
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
};
