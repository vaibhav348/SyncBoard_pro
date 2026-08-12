import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    avatarUrl?: string;
    mobileNumber: number;
    password: string;
    role: 'SuperAdmin' | 'owner' | 'manager' | 'employee';
    department?: string;
    title: string;
    companyId: mongoose.Types.ObjectId | null;
}

const UserSchema = new Schema<IUser>({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    avatarUrl: { 
        type: String, 
        required: false 
    },
    mobileNumber: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: [
            'SuperAdmin', 'owner', 'manager', 'employee'
        ],
        default: 'employee'
    },
    department: {
        type: String,
        required: false,
        trim: true
    },
    title: {
        type: String,
        required: true
    },
    companyId: {
        type: Schema.Types.ObjectId,
        ref: "Company",
        required: false
    }
}, {
    timestamps: true
})

const User = mongoose.model<IUser>("User", UserSchema);
export default User;
