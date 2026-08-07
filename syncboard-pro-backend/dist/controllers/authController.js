"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyInviteToken = exports.getAllUsers = exports.updateProfile = exports.LoginUser = exports.registerUser = void 0;
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Company_1 = __importDefault(require("../models/Company"));
const User_1 = __importDefault(require("../models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Invitation_1 = __importDefault(require("../models/Invitation"));
const mongoose_1 = __importDefault(require("mongoose"));
//------------------Register------------------
const RegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "name shoule be 2 character long"),
    email: zod_1.z.string().email("Email format is wrong"),
    mobileNumber: zod_1.z.number(),
    password: zod_1.z.string().min(8, "Password should be 8 characters"),
    role: zod_1.z.enum(['SuperAdmin', 'owner', 'manager', 'employee']).default('employee'),
    department: zod_1.z.string().optional(),
    title: zod_1.z.string().optional(),
    companyName: zod_1.z.string().optional(),
    companyId: zod_1.z.string().optional(),
    inviteToken: zod_1.z.string().optional()
});
const registerUser = async (req, res) => {
    try {
        const validation = RegisterSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.issues });
        }
        const { name, email, password, role, mobileNumber, department, title, companyName, companyId, inviteToken } = validation.data;
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists bhai!" });
        }
        let finalRole = role;
        let finalCompanyId = null;
        if (role === 'owner') {
            if (!companyName) {
                return res.status(400).json({ message: "Company name is required for create a new owner!" });
            }
            const existingCompany = await Company_1.default.findOne({ name: companyName });
            if (existingCompany) {
                return res.status(400).json({ message: "Company has been already exists, please use diffrent company name!" });
            }
            const newCompany = await Company_1.default.create({ name: companyName });
            finalCompanyId = newCompany._id;
        }
        if (role === 'manager' || role === 'employee') {
            if (!inviteToken) {
                return res.status(400).json({ message: "Registration blocked! Valid Invitation Token is required for this role." });
            }
            // Verify Invitation Token
            const invitation = await Invitation_1.default.findOne({ token: inviteToken, isUsed: false });
            if (!invitation) {
                return res.status(400).json({ message: "Invalid or already used invitation token." });
            }
            // Check Expiry
            if (new Date() > invitation.expiresAt) {
                return res.status(400).json({ message: "Invitation token has expired." });
            }
            // Safeguard Email: Jis email ko invite kiya tha, wahi register ho sake
            if (invitation.email !== email) {
                return res.status(400).json({ message: "This token was not issued for this email address." });
            }
            finalCompanyId = invitation.companyId;
            finalRole = invitation.role; // Token wala actual role overwrite kar do security ke liye
            // Mark token as used
            invitation.isUsed = true;
            await invitation.save();
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const newUser = await User_1.default.create({
            name,
            email,
            mobileNumber,
            password: hashedPassword,
            role: finalRole,
            department: department || undefined,
            title: title || (finalRole === 'owner' ? 'Company Owner' : 'Team Member'),
            companyId: finalCompanyId
        });
        const token = jsonwebtoken_1.default.sign({
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            companyId: newUser.companyId,
            mobileNumber: newUser.mobileNumber,
            department: newUser.department,
            title: newUser.title
        }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const user = {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            mobileNumber: newUser.mobileNumber,
            department: newUser.department,
            title: newUser.title
        };
        return res.status(201).json({
            message: "User registered successfully!", token,
            user
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error while register: " + error });
    }
};
exports.registerUser = registerUser;
//=================Login=========================
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email("email format is wrong"),
    password: zod_1.z.string().min(1, "password should not empty")
});
const LoginUser = async (req, res) => {
    try {
        const validation = LoginSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.issues });
        }
        const { email, password } = validation.data;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(400).send({ message: "user does not present!" });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send({ message: "Password does not matched!" });
        }
        // (user as any) ka use karke TypeScript ka strict check बाईपास kiya
        const token = jsonwebtoken_1.default.sign({
            id: user._id,
            name: user.name,
            email: user.email,
            mobileNumber: user.mobileNumber,
            role: user.role,
            department: user.department,
            title: user.title,
            companyId: user.companyId
        }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.status(200).json({
            message: "Login successfull!",
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                mobileNumber: user.mobileNumber,
                department: user.department,
                title: user.title
            }
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while Login : " + error });
    }
};
exports.LoginUser = LoginUser;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const UpdateProfileSchema = zod_1.z.object({
            name: zod_1.z.string().min(2, "Name should be at least 2 characters").optional(),
            mobileNumber: zod_1.z.number().optional(),
            title: zod_1.z.string().optional(),
            department: zod_1.z.string().optional()
        });
        const validation = UpdateProfileSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.issues });
        }
        const { name, mobileNumber, title, department } = validation.data;
        const updatedUser = await User_1.default.findByIdAndUpdate(userId, {
            ...(name ? { name } : {}),
            ...(mobileNumber !== undefined ? { mobileNumber } : {}),
            ...(title !== undefined ? { title } : {}),
            ...(department !== undefined ? { department } : {})
        }, { new: true }).select("-password");
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        const token = jsonwebtoken_1.default.sign({
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            companyId: updatedUser.companyId,
            mobileNumber: updatedUser.mobileNumber,
            department: updatedUser.department,
            title: updatedUser.title
        }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.status(200).json({
            message: "Profile updated successfully",
            token,
            user: {
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                mobileNumber: updatedUser.mobileNumber,
                department: updatedUser.department,
                title: updatedUser.title
            }
        });
    }
    catch (error) {
        console.error("Error in updateProfile:", error);
        return res.status(500).json({ message: "Error while updating profile: " + error });
    }
};
exports.updateProfile = updateProfile;
const getAllUsers = async (req, res) => {
    try {
        const { id: userId, role: userRole, companyId } = req.user;
        // 1. Guard Clause: Employees ko block karo
        if (userRole === 'employee') {
            return res.status(403).json({ message: "Employees are not allowed to view company members!" });
        }
        const query = {
            companyId,
            _id: { $ne: userId } // 👈 Mera id is list mein nahi hona chahiye
        };
        // 2. Query Setup: Poori company ke active users ko find karo
        const allUsers = await mongoose_1.default.model("User")
            .find(query)
            .select("-password") // 👈 Password secure tarike se remove kar diya
            .sort({ createdAt: -1 }); // Naye users sabse upar dikhenge
        return res.status(200).json({
            message: "Successfully received all members",
            allUsers
        });
    }
    catch (error) {
        console.error("Error in getAllUsers:", error);
        return res.status(500).json({ message: "Error while fetching members: " + error });
    }
};
exports.getAllUsers = getAllUsers;
// 🔴 Backend Controller: Token verify karne ke liye endpoints export karo
const verifyInviteToken = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ message: "Invitation token is completely missing!" });
        }
        // Token check karo Jo active ho aur use na hua ho
        const invitation = await Invitation_1.default.findOne({ token: token, isUsed: false });
        if (!invitation) {
            return res.status(400).json({ message: "This invitation link is invalid or has already been used." });
        }
        // Schema validation: check token expiry
        // Note: Agar model schema me expiresAt ki jagah 'createdAt' TTL index use kiya h to ise remove kar sakte ho
        if (invitation.expiresAt && new Date() > invitation.expiresAt) {
            return res.status(400).json({ message: "This invitation link has expired." });
        }
        // Frontend ko user data return karo jo locked fields me dikhana hai
        return res.status(200).json({
            email: invitation.email,
            role: invitation.role
        });
    }
    catch (error) {
        console.error("Error in verifyInviteToken:", error);
        return res.status(500).json({ message: "Server token check failed: " + error });
    }
};
exports.verifyInviteToken = verifyInviteToken;
