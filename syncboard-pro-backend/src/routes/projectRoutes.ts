import { Router } from "express";
import { addProjectMember, createProject, getCompanyProject, getProjectWithTeam } from "../controllers/projectController";
import { protect } from "../middlewares/authMiddleware";

const projectRoutes = Router()

projectRoutes.post('/create', protect, createProject)
projectRoutes.get('/get', protect, getCompanyProject)
projectRoutes.post('/:id/members', protect, addProjectMember)
projectRoutes.get('/:id', protect, getProjectWithTeam)

export default projectRoutes