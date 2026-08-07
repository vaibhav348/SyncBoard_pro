import mongoose, { Schema, Document } from "mongoose";

export interface ICompany extends Document {
  name: string;
  plan: 'Free' | 'Growth' | 'Enterprise';
  isActive: boolean;  
}

const CompanySchema = new Schema<ICompany>({
    name: {
        type: String,
        required: true,
        unique: true 
    },
    plan: {
        type: String,
        enum: ['Free', 'Growth', 'Enterprise'],
        default: 'Free'
    },
    isActive: {
        type: Boolean, 
        default: true
    }
}, {
    timestamps: true
});

const Company = mongoose.model<ICompany>("Company", CompanySchema);
export default Company;