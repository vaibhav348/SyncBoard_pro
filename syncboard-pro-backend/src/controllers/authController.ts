import { Request, Response } from "express"; // any ki jagah sahi Express types use karenge
import { z } from "zod";
import bcrypt from "bcryptjs";
import Company from "../models/Company";
import User from "../models/User";
import jwt from "jsonwebtoken"
import Invitation from "../models/Invitation";
import mongoose from "mongoose";


//------------------Register------------------
const RegisterSchema = z.object({
    name: z.string().min(2, "name shoule be 2 character long"),
    email: z.string().email("Email format is wrong"),
    mobileNumber: z.number(),
    password: z.string().min(8, "Password should be 8 characters"),
    role: z.enum(['SuperAdmin', 'owner', 'manager', 'employee']).default('employee'),
    department: z.string().optional(),
    title: z.string().optional(),
    companyName: z.string().optional(),
    companyId: z.string().optional(),
    inviteToken: z.string().optional()
});

export const registerUser = async (req: Request, res: Response) => {
    try {

        const validation = RegisterSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.issues });
        }
        const { name, email, password, role, mobileNumber, department, title, companyName, companyId, inviteToken } = validation.data;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists bhai!" });
        }


        let finalRole = role;
        let finalCompanyId = null;

        if (role === 'owner') {
            if (!companyName) {
                return res.status(400).json({ message: "Company name is required for create a new owner!" })
            }
            const existingCompany = await Company.findOne({ name: companyName });
            if (existingCompany) {
                return res.status(400).json({ message: "Company has been already exists, please use diffrent company name!" });
            }
            const newCompany = await Company.create({ name: companyName })
            finalCompanyId = newCompany._id;
        }

        if (role === 'manager' || role === 'employee') {
            if (!inviteToken) {
                return res.status(400).json({ message: "Registration blocked! Valid Invitation Token is required for this role." });
            }

            // Verify Invitation Token
            const invitation = await Invitation.findOne({ token: inviteToken, isUsed: false });
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
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const avatarUrl = req.file ? (req.file as any).path : undefined;

        const newUser = await User.create({
            name,
            email,
            mobileNumber,
            password: hashedPassword as any,
            role: finalRole,
            department: department || undefined,
            title: title || (finalRole === 'owner' ? 'Company Owner' : 'Team Member'),
            companyId: finalCompanyId as any,
            avatarUrl 
        });

        const token = jwt.sign(
            {
                id: newUser._id,
                name : newUser.name,
                email: newUser.email,
                role: newUser.role,
                companyId: newUser.companyId,
                mobileNumber: newUser.mobileNumber,
                department: newUser.department,
                title: newUser.title
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' }
        );
        const user = {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            mobileNumber: newUser.mobileNumber,
            department: newUser.department,
            title: newUser.title

        }
        return res.status(201).json({
            message: "User registered successfully!", token,
            user
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error while register: " + error });
    }
};

//=================Login=========================
const LoginSchema = z.object({
    email: z.string().email("email format is wrong"),
    password: z.string().min(1, "password should not empty")
})

export const LoginUser = async (req: Request, res: Response) => {
    try {
        const validation = LoginSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.issues });
        }
        const { email, password } = validation.data;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send({ message: "user does not present!" });
        }

        const isMatch = await bcrypt.compare(password, (user as any).password);
        if (!isMatch) {
            return res.status(401).send({ message: "Password does not matched!" });
        }

        // (user as any) ka use karke TypeScript ka strict check बाईपास kiya
        const token = jwt.sign(
            {
                id: (user as any)._id,
                name : (user as any).name,
                email: (user as any).email,
                mobileNumber: (user as any).mobileNumber,
                role: (user as any).role,
                department: (user as any).department,
                title: (user as any).title,
                companyId: (user as any).companyId
 
                
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            message: "Login successfull!",
            token: token,
            user: {
                id : user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            mobileNumber: user.mobileNumber,
            department: user.department,
            title: user.title

            }


        })


    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while Login : " + error });
    }
}

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
console.log("hi");

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const UpdateProfileSchema = z.object({
            name: z.string().min(2, "Name should be at least 2 characters").optional(),
            mobileNumber: z.coerce.number().optional(),   // 👈 coerce, since it comes from form-data now
            title: z.string().optional(),
            department: z.string().optional()
        });

        const validation = UpdateProfileSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.issues });
        }

        const { name, mobileNumber, title, department } = validation.data;

        // 👇 avatar is optional here — only present if the user picked a new photo
        const avatarUrl = req.file ? (req.file as any).path : undefined;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                ...(name ? { name } : {}),
                ...(mobileNumber !== undefined ? { mobileNumber } : {}),
                ...(title !== undefined ? { title } : {}),
                ...(department !== undefined ? { department } : {}),
                ...(avatarUrl ? { avatarUrl } : {})
            },
            { new: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const token = jwt.sign(
            {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                companyId: updatedUser.companyId,
                mobileNumber: updatedUser.mobileNumber,
                department: updatedUser.department,
                title: updatedUser.title,
                avatarUrl: updatedUser.avatarUrl   // 👈 add
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            message: "Profile updated successfully",
            token,
            user: {
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                mobileNumber: updatedUser.mobileNumber,
                department: updatedUser.department,
                title: updatedUser.title,
                avatarUrl: updatedUser.avatarUrl   // 👈 add
            }
        });
    } catch (error) {
        console.error("Error in updateProfile:", error);
        return res.status(500).json({ message: "Error while updating profile: " + error });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const {
            id: userId,
            role: userRole,
            companyId
        } = (req as any).user;

        // 1. Guard Clause: Employees ko block karo
        if (userRole === 'employee') {
            return res.status(403).json({ message: "Employees are not allowed to view company members!" });
        }
        const query = {
            companyId,
            _id: { $ne: userId } // 👈 Mera id is list mein nahi hona chahiye
        };
        // 2. Query Setup: Poori company ke active users ko find karo
        const allUsers = await mongoose.model("User")
            .find(query)
            .select("-password") // 👈 Password secure tarike se remove kar diya
            .sort({ createdAt: -1 }); // Naye users sabse upar dikhenge

        return res.status(200).json({
            message: "Successfully received all members",
            allUsers
        });
    } catch (error) {
        console.error("Error in getAllUsers:", error);
        return res.status(500).json({ message: "Error while fetching members: " + error });
    }
};

// 🔴 Backend Controller: Token verify karne ke liye endpoints export karo
export const verifyInviteToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ message: "Invitation token is completely missing!" });
        }

        // Token check karo Jo active ho aur use na hua ho
        const invitation = await Invitation.findOne({ token: token as string, isUsed: false });

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

    } catch (error) {
        console.error("Error in verifyInviteToken:", error);
        return res.status(500).json({ message: "Server token check failed: " + error });
    }
};

//------------------Upload Avatar------------------
export const uploadAvatar = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Avatar file is missing bhai!" });
        }

        const avatarUrl = (req.file as any).path; // secure_url set by multer-storage-cloudinary

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { avatarUrl },
            { new: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const token = jwt.sign(
            {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                companyId: updatedUser.companyId,
                mobileNumber: updatedUser.mobileNumber,
                department: updatedUser.department,
                title: updatedUser.title,
                avatarUrl: updatedUser.avatarUrl
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            message: "Avatar uploaded successfully!",
            token,
            user: {
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                mobileNumber: updatedUser.mobileNumber,
                department: updatedUser.department,
                title: updatedUser.title,
                avatarUrl: updatedUser.avatarUrl
            }
        });

    } catch (error) {
        console.error("Error in uploadAvatar:", error);
        return res.status(500).json({ message: "Error while uploading avatar: " + error });
    }
};