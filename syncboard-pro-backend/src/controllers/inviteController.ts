import { Request, Response } from "express";
import Invitation from "../models/Invitation";
import crypto from "crypto"
import mongoose from "mongoose";
export const sendInvite = async (req: Request, res: Response) => {
    console.log('[INVITE] sendInvite called — body:', req.body);
    try {
        const user = (req as any).user;
        console.log("user", user);

        const {
            id: inviterId,
            role: inviterRole,
            companyId
        } = (req as any).user;

        const { email, role } = req.body;
        if (inviterRole === 'manager' && role !== 'employee') {
            return res.status(403).json({ message: " Manager only create employee role" })
        };
        if (inviterRole === 'employee') {
            return res.status(403).json({
                message: "Employee can't invite anyone"
            })
        }
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await Invitation.create({
            email,
            role,
            companyId,
            invitedBy: inviterId,
            token,
            expiresAt
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
        const inviteLink = `${frontendUrl}/accept-invite?token=${token}`;

        console.log('────────────────────────────────────────');
        console.log(`[INVITE] Email: ${email} | Role: ${role}`);
        console.log(`[INVITE] Link: ${inviteLink}`);
        console.log('────────────────────────────────────────');

        return res.status(200).json({
            message: "Invitation generated successfully!"
        });


    } catch (error) {
        console.error('[INVITE] Error:', error);
        return res.status(500).json({ message: "Server error while inviting: " + error })

    }
}

export const getInvitation = async (req: Request, res: Response) => {
    try {
        const {
            id: inviterId,
            role: inviterRole,
            companyId
        } = (req as any).user;

        // 1. Guard Clause: Agar employee try kare toh turant block karo
        if (inviterRole === 'employee') {
            return res.status(403).json({ message: "Employees are not allowed to view invitations!" });
        }

        let query: any = { companyId, isUsed: false }; // Sirf pending invitations fetch karenge

        // 2. Role-Based Query Modification
        if (inviterRole === 'manager') {
            // Manager sirf apne generated invites dekhega
            query.invitedBy = inviterId;
        }
        // Owner ke case mein query auto-configured hai (poori company ka data)

        // 3. Database Lookup (.populate se inviter ki details bhi mil jayengi tab ke liye)
        const invitations = await mongoose.model("Invitation")
            .find(query)
            .select("-token") // 👈 Yeh line token ko response mein aane se rokegi
            .populate("invitedBy", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Successfully received pending invitations",
            invitations
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error while fetching invitations: " + error });
    }
};