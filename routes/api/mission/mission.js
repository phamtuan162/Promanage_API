var express = require("express");
var router = express.Router();
const missionController = require("../../../controllers/api/mission/mission.controller");
const permission = require("../../../middlewares/api/permission.middleware");
const authMiddleware = require("../../../middlewares/api/auth.middleware");

router.get("/", missionController.index);
router.get("/:id", missionController.find);
router.post(
  "/",
  authMiddleware,
  permission("mission.create"),
  missionController.store
);
router.post(
  "/transfer-card/:id",
  authMiddleware,
  permission("mission.transfer_card"),
  missionController.transferCard
);
router.put(
  "/:id",
  authMiddleware,
  permission("mission.update"),
  missionController.update
);
router.patch(
  "/:id",
  authMiddleware,
  permission("mission.update"),
  missionController.update
);
router.delete(
  "/:id",
  authMiddleware,
  permission("mission.delete"),
  missionController.delete
);
module.exports = router;
