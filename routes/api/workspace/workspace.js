var express = require("express");
var router = express.Router();
const workspaceController = require("../../../controllers/api/workspace/workspace.controller");
const permission = require("../../../middlewares/api/permission.middleware");
const authMiddleware = require("../../../middlewares/api/auth.middleware");

router.get("/", workspaceController.index);
router.get(
  "/:id",
  authMiddleware,
  permission("workspace.read"),
  workspaceController.find
);
router.post("/", authMiddleware, workspaceController.store);
router.post(
  "/invite",
  authMiddleware,
  permission("workspace.invite"),
  workspaceController.inviteUser
);
router.put(
  "/decent-role/:id",
  authMiddleware,
  permission("workspace.decent_role"),
  workspaceController.decentRoleUser
);
router.put(
  "/change-workspace/:id",
  authMiddleware,
  workspaceController.changeWorkspace
);

router.put(
  "/leave-workspace",
  authMiddleware,
  workspaceController.leaveWorkspace
);
router.put(
  "/cancel-user",
  authMiddleware,
  permission("workspace.cancel"),
  workspaceController.cancelUser
);
router.put(
  "/:id",
  authMiddleware,
  permission("workspace.update"),
  workspaceController.update
);
router.put("/restore/:id", authMiddleware, workspaceController.restore);

router.patch(
  "/:id",
  authMiddleware,
  permission("workspace.update"),
  workspaceController.update
);
router.delete(
  "/:id",
  authMiddleware,
  permission("workspace.delete"),
  workspaceController.delete
);

module.exports = router;
