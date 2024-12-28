const { Board } = require("../../models/index");

const checkBoardInWorkspace = async (req, res, next) => {
  const { id } = req.params;

  const user = req.user.dataValues;

  try {
    const board = await Board.findByPk(id);
    if (!board) {
      return res.status(404).json({ message: "Bảng không tồn tại." });
    }

    if (board.workspace_id !== user.workspace_id_active) {
      return res.status(401).json({
        message: "Bảng này không thuộc không gian làm việc hiện tại.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = checkBoardInWorkspace;
