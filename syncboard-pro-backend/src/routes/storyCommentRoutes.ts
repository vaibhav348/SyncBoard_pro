import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { createStoryComment, getStoryComments } from "../controllers/storyCommentController";

const storyCommentRoutes = Router();

storyCommentRoutes.post("/create", protect, createStoryComment);
storyCommentRoutes.get("/get_by_story/:storyId", protect, getStoryComments);

export default storyCommentRoutes;
