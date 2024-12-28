var express = require("express");
var router = express.Router();
const workController = require("../../../controllers/api/work/work.controller");
const permission = require("../../../middlewares/api/permission.middleware");
const authMiddleware = require("../../../middlewares/api/auth.middleware");

router.get("/", workController.index);
router.get("/:id", workController.find);
router.post(
  "/",
  authMiddleware,
  permission("work.create"),
  workController.store
);
router.put(
  "/:id",
  authMiddleware,
  permission("work.update"),
  workController.update
);
router.patch(
  "/:id",
  authMiddleware,
  permission("work.update"),
  workController.update
);
router.delete(
  "/:id",
  authMiddleware,
  permission("work.delete"),
  workController.delete
);
module.exports = router;
