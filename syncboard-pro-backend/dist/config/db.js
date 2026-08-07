"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        // Process.env se MONGO_URI uthayenge, agar nahi mili toh local backup use karenge
        const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/syncboard_pro';
        const conn = await mongoose_1.default.connect(mongoURI);
        console.log(`🚀 MongoDB Connected Successfully: ${conn.connection.host}`);
    }
    catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        // Agar DB connect nahi hua toh backend server chalane ka koi fayda nahi, instantly exit kar jao
        process.exit(1);
    }
};
exports.connectDB = connectDB;
