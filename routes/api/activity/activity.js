var express = require("express");
var router = express.Router();
const activityController = require("../../../controllers/api/activity/activity.controller");

router.get("/", activityController.index);
router.get("/:id", activityController.find);
router.post("/", activityController.store);
router.put("/:id", activityController.update);
router.patch("/:id", activityController.update);
router.delete("/:id", activityController.delete);
module.exports = router;
