import mongoose, { Schema, Document } from "mongoose";

export interface ICounter extends Document {
  projectId: mongoose.Types.ObjectId;
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: "Project",
    required: true,
    unique: true, // Ek project ka sirf ek hi counter document hoga
  },
  seq: {
    type: Number,
    default: 0,
  },
});

const Counter = mongoose.model<ICounter>("Counter", CounterSchema);
export default Counter;