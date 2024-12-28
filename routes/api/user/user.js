var express = require("express");
var router = express.Router();
const userController = require("../../../controllers/api/user/user.controller");
const authMiddleware = require("../../../middlewares/api/auth.middleware");
const multerUploadMiddleware = require("../../../middlewares/api/multerUpload.middleware");

router.get("/", authMiddleware, userController.index);
router.get("/:id", authMiddleware, userController.find);
router.post("/", authMiddleware, userController.store);
router.put("/:id", authMiddleware, userController.update);
router.patch("/:id", authMiddleware, userController.update);
router.post(
  "/update_avatar/:id",
  authMiddleware,
  multerUploadMiddleware.upload.single("avatar"),
  userController.updateAvatar
);
router.delete("/:id", authMiddleware, userController.delete);

module.exports = router;
