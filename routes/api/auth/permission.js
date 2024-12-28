var express = require("express");
var router = express.Router();
const permissionController = require("../../../controllers/api/auth/permission.controller");

router.get("/", permissionController.index);
router.get("/:id", permissionController.find);
router.post("/", permissionController.store);
router.put("/:id", permissionController.update);
router.patch("/:id", permissionController.update);
router.delete("/:id", permissionController.delete);
module.exports = router;
