import mongoose from "mongoose";
// import dotenv from "dotenv";
import 'dotenv/config'
const URI = process.env.MONGODB_URI;

export const connectServer = async()=>{
    try {
        await mongoose.connect(URI);
        console.log("Server Connected Successfuly")    
    } catch (error) {
        console.log("Server Connection failed");
        console.error("MongoDB Connection failed:", error.message);
        process.exit(1);
    }
}

