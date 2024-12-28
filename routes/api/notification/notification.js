var express = require("express");
var router = express.Router();
const notificationController = require("../../../controllers/api/notification/notification.controller");

router.get("/", notificationController.index);
router.get("/:id", notificationController.find);
router.post("/", notificationController.store);
router.put("/mark-as-read", notificationController.markAsRead);
router.put("/click-notify", notificationController.clickNotify);

router.delete("/:id", notificationController.delete);
module.exports = router;
