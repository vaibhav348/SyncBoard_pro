import mongoose, { Schema } from "mongoose";

export interface IInvitation extends Document {
    email: string;
    role: 'manager' | 'employee';
    companyId: mongoose.Types.ObjectId;
    invitedBy: mongoose.Types.ObjectId;
    token: string;
    isUsed: boolean;
    expiresAt: Date;
}

const InvitationSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['manager', 'employee'],
        required: true
    },
    companyId: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    invitedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model<IInvitation>("Invitation", InvitationSchema);