import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import issueRoutes from './routes/issueRoutes';
import { addProjectMember } from './controllers/projectController';
import { protect } from './middlewares/authMiddleware';
import sprintRoutes from './routes/sprintRoutes';
import userStoryRoutes from './routes/userStoryRoutes';
import taskRoutes from './routes/taskRoutes';
import taskCommentRoutes from './routes/taskCommentRoutes';
import storyCommentRoutes from './routes/storyCommentRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());

// Single JSON parser, single limit. Keep this — don't duplicate express.json().
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Error handler must come AFTER the parsers that can throw, and needs all 4 args
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err?.type === "entity.too.large") {
        return res.status(413).json({ message: "Request payload is too large." });
    }
    next(err);
});

// Log every API request in the backend terminal (not browser console)
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.originalUrl}`);
  }
  next();
});

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'Success',
    message: 'SyncBoard Pro Enterprise API Engine is up and running',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/issue', issueRoutes);
app.use('/api/sprint', sprintRoutes);
app.use('/api/story', userStoryRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/task-comment', taskCommentRoutes);
app.use('/api/story-comment', storyCommentRoutes);

// Explicit route — avoids router mount edge-cases for add-member
app.post('/api/project/:id/members', protect, addProjectMember);
app.post('/api/project/members/:id', protect, addProjectMember);

app.listen(PORT, () => {
  console.log(`📡 SyncBoard Pro Server listening on port: ${PORT}`);
  console.log('   Routes ready:');
  console.log('   POST /api/auth/invite');
  console.log('   POST /api/project/:id/members');
  console.log('   POST /api/project/members/:id');
});
