"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const storyCommentController_1 = require("../controllers/storyCommentController");
const storyCommentRoutes = (0, express_1.Router)();
storyCommentRoutes.post("/create", authMiddleware_1.protect, storyCommentController_1.createStoryComment);
storyCommentRoutes.get("/get_by_story/:storyId", authMiddleware_1.protect, storyCommentController_1.getStoryComments);
exports.default = storyCommentRoutes;
