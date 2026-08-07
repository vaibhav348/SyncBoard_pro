"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canManageSprint = void 0;
const normalizeRole = (role) => {
    const lowered = role?.toLowerCase();
    if (lowered === 'superadmin' || lowered === 'owner' || lowered === 'admin')
        return lowered === 'superadmin' ? 'superadmin' : lowered === 'owner' ? 'owner' : 'admin';
    if (lowered === 'manager')
        return 'manager';
    return 'employee';
};
const getUserId = (user) => user?._id ?? user?.id ?? null;
const getEntityId = (value) => {
    if (!value)
        return null;
    if (typeof value === 'string')
        return value;
    return value._id ?? null;
};
const canManageSprint = (user, project, sprint) => {
    const role = normalizeRole(user?.role);
    if (role === 'superadmin' || role === 'owner' || role === 'admin')
        return true;
    const currentUserId = getUserId(user);
    if (!currentUserId)
        return false;
    const projectCreatorId = getEntityId(project?.createdBy ?? project?.project_owner ?? project?.owner);
    const projectManagerId = getEntityId(project?.managerId);
    const sprintCreatorId = getEntityId(sprint?.createdBy);
    const isProjectOwnerOrManager = Boolean((projectCreatorId && String(projectCreatorId) === String(currentUserId)) ||
        (projectManagerId && String(projectManagerId) === String(currentUserId)));
    if (isProjectOwnerOrManager)
        return true;
    return Boolean(role === 'manager' && sprintCreatorId && String(sprintCreatorId) === String(currentUserId));
};
exports.canManageSprint = canManageSprint;
