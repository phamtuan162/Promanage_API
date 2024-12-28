const { Device } = require("../../../models/index");

module.exports = {
  index: async (req, res) => {},
  find: async (req, res) => {},
  store: async (req, res) => {},
  update: async (req, res) => {},
  logoutDevice: async (req, res) => {},
  delete: async (req, res) => {
    const { id } = req.params;
    try {
      await Device.destroy({ where: { id } });

      res.status(204).json({
        status: 204,
        message: "Success",
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: "Server error",
      });
    }
  },
};
