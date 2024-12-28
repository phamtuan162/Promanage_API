var express = require("express");
var router = express.Router();
const commentController = require("../../../controllers/api/comment/comment.controller");
const authMiddleware = require("../../../middlewares/api/auth.middleware");

router.get("/", authMiddleware, commentController.index);
router.get("/:id", authMiddleware, commentController.find);
router.post("/", authMiddleware, commentController.store);
router.put("/:id", authMiddleware, commentController.update);
router.patch("/:id", authMiddleware, commentController.update);
router.delete("/:id", authMiddleware, commentController.delete);
module.exports = router;
