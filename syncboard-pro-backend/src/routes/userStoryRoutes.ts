import { Router } from "express";
  
import { protect } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/rbacMiddleware";
import { createStory, deleteStory, getBacklogStories, getStoriesBySprint, getStoryById, moveStoryToSprint, updateStory } from "../controllers/userStoryController";

const userStoryRoutes = Router();

userStoryRoutes.post("/create", protect, authorize('story.create'), createStory);
userStoryRoutes.get("/get_backlog/:projectId", protect, getBacklogStories);
userStoryRoutes.get("/get_by_sprint/:sprintId", protect, getStoriesBySprint);
userStoryRoutes.get("/get_by_id/:storyId", protect, getStoryById);
userStoryRoutes.patch("/update/:storyId", protect, authorize('story.edit'), updateStory);
userStoryRoutes.put("/move_to_sprint/:storyId", protect, authorize('task.move'), moveStoryToSprint);
userStoryRoutes.delete("/delete/:storyId", protect, authorize('story.delete'), deleteStory);

export default userStoryRoutes;