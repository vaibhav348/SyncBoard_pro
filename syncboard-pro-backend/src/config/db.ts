import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    // Process.env se MONGO_URI uthayenge, agar nahi mili toh local backup use karenge
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/syncboard_pro';
    
    const conn = await mongoose.connect(mongoURI);
    
    console.log(`🚀 MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${(error as Error).message}`);
    // Agar DB connect nahi hua toh backend server chalane ka koi fayda nahi, instantly exit kar jao
    process.exit(1);
  }
};
