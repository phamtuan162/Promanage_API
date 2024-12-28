var express = require("express");
var router = express.Router();
const deviceController = require("../../../controllers/api/device/device.controller");

router.get("/", deviceController.index);
router.get("/:id", deviceController.find);
router.post("/", deviceController.store);
router.put("/logout-device/:id", deviceController.logoutDevice);
router.patch("/logout-device/:id", deviceController.logoutDevice);
router.delete("/:id", deviceController.delete);
module.exports = router;
