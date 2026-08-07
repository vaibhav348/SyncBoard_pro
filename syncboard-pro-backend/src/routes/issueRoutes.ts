import { Router } from "express";
import { addCommentToIssue, createIssue, getProjectIssues, getIssueById, getIssueComments, updateIssue, getIssuesByTask, getIssuesBySprint, updateIssueComment, deleteIssueComment, deleteIssue } from "../controllers/issueController";
import { protect } from "../middlewares/authMiddleware";

const issueRoutes = Router()

issueRoutes.post('/create',protect, createIssue)
issueRoutes.get('/get_all_issue/:projectId', protect, getProjectIssues)
issueRoutes.get('/:issueId', protect, getIssueById)
issueRoutes.patch('/update_issue/:issueId', protect, updateIssue)
issueRoutes.delete('/delete/:issueId', protect, deleteIssue)
issueRoutes.post('/:issueId/comments',protect, addCommentToIssue);
issueRoutes.get('/:issueId/comments',protect, getIssueComments);
issueRoutes.patch('/:issueId/comments/:commentId', protect, updateIssueComment);
issueRoutes.delete('/:issueId/comments/:commentId', protect, deleteIssueComment);
issueRoutes.get("/get_by_task/:taskId", protect, getIssuesByTask);
issueRoutes.get("/get_by_sprint/:sprintId", protect, getIssuesBySprint);

export default issueRoutes