"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInvitation = exports.sendInvite = void 0;
const Invitation_1 = __importDefault(require("../models/Invitation"));
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const sendInvite = async (req, res) => {
    console.log('[INVITE] sendInvite called — body:', req.body);
    try {
        const user = req.user;
        console.log("user", user);
        const { id: inviterId, role: inviterRole, companyId } = req.user;
        const { email, role } = req.body;
        if (inviterRole === 'manager' && role !== 'employee') {
            return res.status(403).json({ message: " Manager only create employee role" });
        }
        ;
        if (inviterRole === 'employee') {
            return res.status(403).json({
                message: "Employee can't invite anyone"
            });
        }
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await Invitation_1.default.create({
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
    }
    catch (error) {
        console.error('[INVITE] Error:', error);
        return res.status(500).json({ message: "Server error while inviting: " + error });
    }
};
exports.sendInvite = sendInvite;
const getInvitation = async (req, res) => {
    try {
        const { id: inviterId, role: inviterRole, companyId } = req.user;
        // 1. Guard Clause: Agar employee try kare toh turant block karo
        if (inviterRole === 'employee') {
            return res.status(403).json({ message: "Employees are not allowed to view invitations!" });
        }
        let query = { companyId, isUsed: false }; // Sirf pending invitations fetch karenge
        // 2. Role-Based Query Modification
        if (inviterRole === 'manager') {
            // Manager sirf apne generated invites dekhega
            query.invitedBy = inviterId;
        }
        // Owner ke case mein query auto-configured hai (poori company ka data)
        // 3. Database Lookup (.populate se inviter ki details bhi mil jayengi tab ke liye)
        const invitations = await mongoose_1.default.model("Invitation")
            .find(query)
            .select("-token") // 👈 Yeh line token ko response mein aane se rokegi
            .populate("invitedBy", "name email")
            .sort({ createdAt: -1 });
        return res.status(200).json({
            message: "Successfully received pending invitations",
            invitations
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Server error while fetching invitations: " + error });
    }
};
exports.getInvitation = getInvitation;
