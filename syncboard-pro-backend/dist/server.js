"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const issueRoutes_1 = __importDefault(require("./routes/issueRoutes"));
const projectController_1 = require("./controllers/projectController");
const authMiddleware_1 = require("./middlewares/authMiddleware");
const sprintRoutes_1 = __importDefault(require("./routes/sprintRoutes"));
const userStoryRoutes_1 = __importDefault(require("./routes/userStoryRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const taskCommentRoutes_1 = __importDefault(require("./routes/taskCommentRoutes"));
const storyCommentRoutes_1 = __importDefault(require("./routes/storyCommentRoutes"));
const searchRoutes_1 = __importDefault(require("./routes/searchRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
(0, db_1.connectDB)();
app.use((0, cors_1.default)());
// Single JSON parser, single limit. Keep this — don't duplicate express.json().
app.use(express_1.default.json({ limit: "1mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "1mb" }));
// Error handler must come AFTER the parsers that can throw, and needs all 4 args
app.use((err, req, res, next) => {
    if (err?.type === "entity.too.large") {
        return res.status(413).json({ message: "Request payload is too large." });
    }
    next(err);
});
// Log every API request in the backend terminal (not browser console)
app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
        console.log(`[API] ${req.method} ${req.originalUrl}`);
    }
    next();
});
app.get('/', (_req, res) => {
    res.status(200).json({
        status: 'Success',
        message: 'SyncBoard Pro Enterprise API Engine is up and running',
    });
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/project', projectRoutes_1.default);
app.use('/api/issue', issueRoutes_1.default);
app.use('/api/sprint', sprintRoutes_1.default);
app.use('/api/story', userStoryRoutes_1.default);
app.use("/api/projects", searchRoutes_1.default);
app.use('/api/task', taskRoutes_1.default);
app.use('/api/task-comment', taskCommentRoutes_1.default);
app.use('/api/story-comment', storyCommentRoutes_1.default);
// Explicit route — avoids router mount edge-cases for add-member
app.post('/api/project/:id/members', authMiddleware_1.protect, projectController_1.addProjectMember);
app.post('/api/project/members/:id', authMiddleware_1.protect, projectController_1.addProjectMember);
app.listen(PORT, () => {
    console.log(`📡 SyncBoard Pro Server listening on port: ${PORT}`);
    console.log('   Routes ready:');
    console.log('   POST /api/auth/invite');
    console.log('   POST /api/project/:id/members');
    console.log('   POST /api/project/members/:id');
});
