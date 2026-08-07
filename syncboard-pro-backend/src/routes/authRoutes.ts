import { Router } from "express";
import { getAllUsers, LoginUser, registerUser, updateProfile, verifyInviteToken } from "../controllers/authController";
import { getInvitation, sendInvite } from "../controllers/inviteController";
import { protect } from "../middlewares/authMiddleware";

const authRoutes = Router()

authRoutes.post('/register', registerUser)
authRoutes.post('/login', LoginUser)
authRoutes.post('/invite',protect, sendInvite)
authRoutes.get('/invite',protect, getInvitation)
authRoutes.get('/verify-invite', verifyInviteToken)
authRoutes.put('/update-profile', protect, updateProfile)
authRoutes.get('/users',protect, getAllUsers)

export default authRoutes