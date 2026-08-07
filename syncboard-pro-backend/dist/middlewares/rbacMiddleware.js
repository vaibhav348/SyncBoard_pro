"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const ROLE_PERMISSIONS = {
    superadmin: [
        'project.create', 'project.delete', 'workspace.manage', 'billing.manage', 'users.manage',
        'sprint.create', 'sprint.manage', 'story.create', 'story.edit', 'story.delete',
        'task.create', 'task.edit', 'task.delete', 'task.move', 'comment.create',
        'board.view', 'project.settings.manage', 'project.members.manage'
    ],
    owner: [
        'project.create', 'project.delete', 'workspace.manage', 'billing.manage', 'users.manage',
        'sprint.create', 'sprint.manage', 'story.create', 'story.edit', 'story.delete',
        'task.create', 'task.edit', 'task.delete', 'task.move', 'comment.create',
        'board.view', 'project.settings.manage', 'project.members.manage'
    ],
    manager: [
        'sprint.create', 'sprint.manage', 'story.create', 'story.edit', 'story.delete',
        'task.create', 'task.edit', 'task.delete', 'task.move', 'comment.create',
        'board.view', 'project.settings.manage', 'project.members.manage'
    ],
    employee: ['board.view', 'task.move', 'comment.create']
};
const normalizeRole = (role) => {
    const normalized = role?.toLowerCase();
    if (normalized === 'owner' || normalized === 'manager' || normalized === 'employee' || normalized === 'superadmin') {
        return normalized;
    }
    return 'employee';
};
const authorize = (permission) => {
    return (req, res, next) => {
        const role = normalizeRole(req.user?.role);
        const required = Array.isArray(permission) ? permission : [permission];
        const allowed = required.every((item) => ROLE_PERMISSIONS[role].includes(item));
        if (!allowed) {
            return res.status(403).json({ message: 'You do not have the required permissions for this action.' });
        }
        return next();
    };
};
exports.authorize = authorize;
