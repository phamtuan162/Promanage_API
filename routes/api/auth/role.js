var express = require("express");
var router = express.Router();
const roleController = require("../../../controllers/api/auth/role.controller");

router.get("/", roleController.index);
router.get("/:id", roleController.find);
router.post("/", roleController.store);
router.put("/:id", roleController.update);
router.patch("/:id", roleController.update);
router.delete("/:id", roleController.delete);
module.exports = router;
