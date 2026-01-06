import mongoose from "mongoose";

const urlSchema = new mongoose.Schema({
    shortcode: {
        type: String,
    },
    longurl: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    }
}, {timestamps: true})

const sessionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    valid: {
        type: Boolean
    },
    user_agent: {
        type: String,
        required: true
    },
    ip: {
        type: String,
        required: true,
    }
}, {timestamps: true})
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,  
    },
    isEmailValid: {
        type: Boolean,
        required: true,
    }
}, {timestamps:true})

const isEmailValid = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    token:{
        type: String,
        required: true,
        length:  8,
    },
    expiresAt:{
        type: Date,
        default: ()=>new Date(Date.now()+24*60*60*1000),
        index: {expires: 86400}
    }
}, {timestamps: true});


const passwordResetTokens = new mongoose.Schema({
        userId: {
            type: String,
            required: true,
        },
        tokenHash: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            default: ()=>new Date(Date.now()+60*60*1000),
            index: {expires: 3600}
        }
}, {timestamps: true});


export const isValidEmail = new mongoose.model("isValidEmail", isEmailValid);
export const User = new mongoose.model("User", userSchema);
export const UrlShortener = new mongoose.model("UrlShortener", urlSchema);
export const sessionSchemaAuth = new mongoose.model("sessionSchema", sessionSchema);
export const resetPasswordToken = new mongoose.model("resetPasswordToken", passwordResetTokens);
