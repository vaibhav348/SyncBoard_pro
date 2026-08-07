import { Request, Response } from "express";
import z from "zod"
import Project from "../models/Project";
import User from "../models/User";

const canManageRoles = new Set(['owner', 'manager', 'SuperAdmin']);

const resolveUserId = (value: any): string | null => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value._id) return String(value._id);
    return String(value);
};

const hasProjectAccess = (project: any, user: any) => {
    const ownerId = resolveUserId(project.project_owner);
    const memberIds = Array.isArray(project.members)
        ? project.members.map((member: any) => resolveUserId(member)).filter(Boolean)
        : [];

    return ownerId === user.id || memberIds.includes(user.id);
};

export const getProjectWithTeam = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized: user not found on request." });
        }

        const { id: projectId } = req.params;
        if (!projectId) {
            return res.status(400).json({ message: "Project ID is required." });
        }

        const project = await Project.findById(projectId)
            .populate({
                path: 'project_owner',
                select: 'name email role department title avatar'
            })
            .populate({
                path: 'members',
                select: 'name email role department title avatar'
            });

        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        const canAccess = hasProjectAccess(project, user);

        if (!canAccess && !canManageRoles.has(user.role)) {
            return res.status(403).json({ message: 'You do not have access to this project.' });
        }

        const projectPayload = {
            _id: project._id,
            name: project.name,
            description: project.description,
            companyId: project.companyId,
            project_owner: project.project_owner,
            members: project.members,
            createdAt: (project as any).createdAt,
            updatedAt: (project as any).updatedAt,
        };

        return res.status(200).json({
            success: true,
            project: projectPayload
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error while fetching project details: ' + error });
    }
};

const AddProjectMemberSchema = z.object({
    memberId: z.string().min(1, "memberId is required"),
});

export const addProjectMember = async (req: Request, res: Response) => {
    console.log('[PROJECT] addProjectMember called — id:', req.params.id, 'body:', req.body);
    try {
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized: user not found on request." });
        }

        const { id: projectId } = req.params;
        if (!projectId) {
            return res.status(400).json({ message: "Project ID is required." });
        }

        if (!canManageRoles.has(user.role)) {
            return res.status(403).json({ message: "You are not allowed to manage project members." });
        }

        const validation = AddProjectMemberSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.issues });
        }

        const { memberId } = validation.data;
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found." });
        }

        if (String(project.companyId) !== String(user.companyId)) {
            return res.status(403).json({ message: "Project does not belong to your company." });
        }

        const member = await User.findById(memberId).select("_id companyId role");
        if (!member) {
            return res.status(404).json({ message: "Member not found." });
        }

        if (String(member.companyId) !== String(user.companyId)) {
            return res.status(400).json({ message: "You can only add members from your company." });
        }

        const alreadyMember = project.members.some((id) => String(id) === memberId);
        if (alreadyMember) {
            return res.status(200).json({ message: "Member is already in this project." });
        }

        project.members.push(member._id as any);
        await project.save();

        const populated = await Project.findById(project._id)
            .populate({
                path: 'project_owner',
                select: 'name email role department title avatar'
            })
            .populate({
                path: 'members',
                select: 'name email role department title avatar'
            });

        return res.status(200).json({
            success: true,
            message: "Member added to project successfully.",
            project: populated
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while adding member to project: " + error });
    }
};

const ProjectSchema = z.object({
    name: z.string().min(3, "Project ka naam kam se kam 3 characters ka hona chahiye"),
    description: z.string().min(5, "Description thoda bada likho bhai"),
    memberIds: z.array(z.string()).optional()
});

export const createProject = async (req: Request, res: Response) => {
    try {
        const validation = ProjectSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.issues });
        }

        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized: user not found on request." });
        }

        const { companyId, id: userId, role } = user;
        if (role === "employee") {
            return res.status(403).json({
                message: "employee does not have permission to create project"
            });
        }

        const { name, description, memberIds = [] } = validation.data;
        const finalMembers = Array.from(new Set([userId, ...memberIds]));
        const newProject = await Project.create({
            name,
            description,
            companyId,
            project_owner: userId,
            members: finalMembers || []
        })

        return res.status(201).json({
            message: "Project successfully created!",
            project: newProject
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "erorr during project creation: " + error });
    }
}

export const getCompanyProject = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized: user not found on request." });
        }

        const { id: userId, role: userRole, companyId } = user;

        let query: any = { companyId };

        if (userRole === 'owner') {
            // 1. Owner Scenario: Apni poori company ke saare projects laao
            // query automatic sirf { companyId } rahegi
        } else if (userRole === 'manager' || userRole === 'employee') {
            // 2 & 3. Manager/Employee Scenario: 
            // Ya toh user us project ka owner/creator ho OR user uske members array mein shamil ho
            query.$or = [
                { project_owner: userId },          // Jisme wo khud project creator hai (Managers ke liye)
                { members: { $in: [userId] } } // Jisme wo allocated member hai (Managers/Employees dono ke liye)
            ];
        }

        const projects = await Project.find(query)
            .populate('project_owner', 'name email role department title')
            .populate('members', 'name email role department title')
            .sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: projects.length,
            projects
        });



    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while Projects fetched: " + error });
    }
}