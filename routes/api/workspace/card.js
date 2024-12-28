var express = require("express");
var router = express.Router();
const cardController = require("../../../controllers/api/workspace/card.controller");
const permission = require("../../../middlewares/api/permission.middleware");
const authMiddleware = require("../../../middlewares/api/auth.middleware");
const { multerMiddleware } = require("../../../utils/multer.utils");
const multerUploadMiddleware = require("../../../middlewares/api/multerUpload.middleware");
const multerAttachmentMiddleware = require("../../../middlewares/api/multerAttachment.middleware");

router.get("/", cardController.index);
router.get("/:id", cardController.find);
router.post(
  "/",
  authMiddleware,
  permission("card.create"),
  cardController.store
);
router.post(
  "/assign-user/:id",
  authMiddleware,
  permission("card.assign_user"),
  cardController.assignUser
);
router.post("/copy-card", authMiddleware, cardController.copyCard);
router.post(
  "/uploads-file/:id",
  authMiddleware,
  multerAttachmentMiddleware.attachment.single("file"),
  cardController.uploads
);
router.put(
  "/un-assign-user/:id",
  authMiddleware,
  permission("card.un_assign_user"),
  cardController.unAssignUser
);
router.put(
  "/date-card/:id",
  authMiddleware,
  permission("card.date_card"),
  cardController.dateCard
);

router.put(
  "/:id",
  authMiddleware,
  multerUploadMiddleware.upload.single("cardCover"),
  permission("card.update"),
  cardController.update
);

router.patch(
  "/:id",
  authMiddleware,
  permission("card.update"),
  cardController.update
);
router.delete(
  "/:id",
  authMiddleware,
  permission("card.delete"),
  cardController.delete
);

module.exports = router;
