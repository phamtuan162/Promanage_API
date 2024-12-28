const Transformer = require("../../core/Transformer");
const BoardTransformer = require("./board.transformer");
const UserTransformer = require("../user/user.transformer");

class WorkspaceTransformer extends Transformer {
  response(instance) {
    return {
      id: instance.id,
      color: instance.color,
      userId: instance.user_id,
      name: instance.name,
      desc: instance.desc,
      boards: instance.boards
        ? instance.boards.map((board) => new BoardTransformer(board))
        : [],
      users: instance.users
        ? instance.users.map((user) => new UserTransformer(user.dataValues))
        : [],
      activities: instance.activities || [],
      isActive: instance.isActive,
      total_user: instance.total_user,
      created_at: instance.created_at,
      updated_at: instance.updated_at,
      deleted_at: instance.deleted_at,
    };
  }
}
module.exports = WorkspaceTransformer;
