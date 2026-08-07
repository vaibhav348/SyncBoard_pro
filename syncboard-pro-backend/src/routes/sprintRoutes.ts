import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/rbacMiddleware";
import { completeSprint, createSprint, getAllSprints, getSprintSummary, startSprint, updateSprint } from "../controllers/sprintController";

const sprintRoutes = Router()

sprintRoutes.post('/create', protect, authorize('sprint.create'), createSprint)

sprintRoutes.get('/get_all/:projectId', protect, getAllSprints)
sprintRoutes.get('/:sprintId/summary', protect, getSprintSummary)
sprintRoutes.patch('/update/:sprintId', protect, authorize('sprint.manage'), updateSprint)
sprintRoutes.put('/update/:sprintId', protect, authorize('sprint.manage'), updateSprint)
sprintRoutes.patch('/start/:sprintId', protect, authorize('sprint.manage'), startSprint)
sprintRoutes.put('/start/:sprintId', protect, authorize('sprint.manage'), startSprint)
sprintRoutes.patch('/complete/:sprintId', protect, authorize('sprint.manage'), completeSprint)
sprintRoutes.put('/complete/:sprintId', protect, authorize('sprint.manage'), completeSprint)
export default sprintRoutes
