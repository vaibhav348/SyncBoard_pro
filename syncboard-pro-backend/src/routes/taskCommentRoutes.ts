import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { createTaskComment, deleteTaskComment, getTaskComments, updateTaskComment } from "../controllers/taskCommentController";
 
const taskCommentRoutes = Router();

taskCommentRoutes.post("/create", protect, createTaskComment);
taskCommentRoutes.get("/get_by_task/:taskId", protect, getTaskComments);
taskCommentRoutes.patch("/update/:commentId", protect, updateTaskComment);
taskCommentRoutes.delete("/delete/:commentId", protect, deleteTaskComment);

export default taskCommentRoutes;