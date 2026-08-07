import { Router } from "express";
import {
  createTask,
  getTasksByStory, 
  getTasksBySprint, 
  updateTask, 
  deleteTask, 
  getTasksById
} from "../controllers/taskController";  
import { protect } from "../middlewares/authMiddleware";

const taskRoutes = Router();

taskRoutes.post("/create", protect, createTask);
taskRoutes.get("/get_by_story/:storyId", protect, getTasksByStory);
taskRoutes.get("/get_by_sprint/:sprintId", protect, getTasksBySprint);
taskRoutes.get("/get_by_id/:taskId", protect, getTasksById);
taskRoutes.patch("/update/:taskId", protect, updateTask); 
taskRoutes.delete("/delete/:taskId", protect, deleteTask);

export default taskRoutes;