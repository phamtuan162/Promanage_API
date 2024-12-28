var express = require("express");
var router = express.Router();
const attachmentController = require("../../../controllers/api/attachment/attachment.controller");
const authMiddleware = require("../../../middlewares/api/auth.middleware");

router.get("/", attachmentController.index);
router.get("/download/:id", attachmentController.downloadFile);

router.get("/:id", attachmentController.find);

router.put("/:id", authMiddleware, attachmentController.update);
router.patch("/:id", authMiddleware, attachmentController.update);
router.delete("/:id", authMiddleware, attachmentController.delete);
module.exports = router;
