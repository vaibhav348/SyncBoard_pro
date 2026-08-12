import { Router, Request, Response, NextFunction } from "express";
import { getAllUsers, LoginUser, registerUser, updateProfile, verifyInviteToken, uploadAvatar } from "../controllers/authController";
import { getInvitation, sendInvite } from "../controllers/inviteController";
import { protect } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/uploadMiddleware";

const authRoutes = Router()

// ✅ FIX: wraps upload.single('avatar') so any Multer/Cloudinary error
// (wrong field name, file too large, invalid format, bad Cloudinary
// credentials, network failure while uploading) is caught explicitly and
// turned into a clean JSON response — instead of an unhandled rejection
// that can crash the whole Node process.
const safeAvatarUpload = (req: Request, res: Response, next: NextFunction) => {
    console.log("-----------------");
    
    upload.single('avatar')(req, res, (err: any) => {
        if (err) {
            console.error('🔴 Avatar upload failed:', err);
            return res.status(400).json({
                
                
                
                message: err?.message || "Failed to upload avatar. Please try a different image.",
            });
        }
        next();
    });
};

authRoutes.post('/register', safeAvatarUpload, registerUser)
authRoutes.post('/login', LoginUser)
authRoutes.post('/invite',protect, sendInvite)
authRoutes.get('/invite',protect, getInvitation)
authRoutes.get('/verify-invite', verifyInviteToken)
authRoutes.put('/update-profile', protect, safeAvatarUpload, updateProfile)
authRoutes.get('/users',protect, getAllUsers)
authRoutes.post('/upload-avatar', protect, safeAvatarUpload, uploadAvatar)

export default authRoutes