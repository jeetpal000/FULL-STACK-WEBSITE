import argon from "argon2";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { isValidEmail, resetPasswordToken, sessionSchemaAuth, User } from "../models/schema.js";
import { sendEmail } from "../lib/nodemailer.js";
// import { sendEmail } from "../lib/send-emails.js";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";
import mjml2html from "mjml";
import fs from "fs/promises";

export const hashPassword = async (password) => {
  return await argon.hash(password);
};

export const verifyPassword = async (password, hash) => {
  return await argon.verify(hash, password);
};


// export const generateToken = async ({id, name, email}) => {
//     return jwt.sign({ id, name, email }, process.env.SECRET_KEY,{
//         expiresIn: "30d"
//     })
// }

export const createSession = async (userId, { ip, userAgent }) => {
  const session = await sessionSchemaAuth.create({
    userId,
    ip,
    user_agent: userAgent,
    valid: true,
  });
  // console.log("session", session);
  return session;
};

export const createAccessToken = ({ id, name, email, sessionId }) => {
  return jwt.sign({ id, name, email, sessionId }, process.env.SECRET_KEY, {
    expiresIn: "7d",
  });
};

export const createRefreshToken = (sessionId) => {
  return jwt.sign({ sessionId }, process.env.SECRET_KEY, {
    expiresIn: "7d",
  });
};

export const verifyJWTtoken = (token) => {
  return jwt.verify(token, process.env.SECRET_KEY);
};

export const findUserById = async (userId) => {
  const user = await User.findById(userId);
  return user;
};

export const findSessionById = async (sessionId) => {
  const session = await sessionSchemaAuth.findById(sessionId);
  // console.log(session);
  return session;
};
//refresh token
export const refreshTokens = async (refreshToken) => {
  try {
    const decodedToken = verifyJWTtoken(refreshToken);
    console.log("Decoded refresh token:", decodedToken);

    const currentSession = await findSessionById(decodedToken.sessionId);
    // console.log("Session from DB:", currentSession);

    if (!currentSession && !currentSession.valid) {
      throw new Error("Invalid Session");
    }
    const user = await findUserById(currentSession.userId);

    if (!user) throw new Error("Invalid User");

    const userInfo = {
      id: user._id,
      name: user.username,
      isEmailValid: user.isEmailValid,
      email: user.email,
      sessionId: currentSession._id,
    };
    const newAccessToken = createAccessToken(userInfo);
    const newRefreshToken = createRefreshToken(currentSession._id);
    return {
      newAccessToken,
      newRefreshToken,
      user: userInfo,
    };
  } catch (error) {
    console.log(error.message);
  }
};

export const clearUserSession = async (sessionId) => {
  await sessionSchemaAuth.findOneAndDelete(sessionId);
};

export const createVerifyLink = async (email, token) => {
  // const uriEncodedEmail = encodeURIComponent(email);
  // return `${process.env.FRONTENED_URL}/verify-email-token?token=${token}&email=${uriEncodedEmail}`

  const url = new URL(`${process.env.FRONTENED_URL}/verify-email`);

  url.searchParams.append("token", token);
  url.searchParams.append("email", email);
  return url.toString();
};

//
export const resendverificationLinkgenerator = async ({ email }) => {
  const min = 10 ** (8 - 1);
  const max = 10 ** 8;

  const randomToken = crypto.randomInt(min, max).toString();
  await isValidEmail.findOneAndUpdate(
    { email },
    { token: randomToken },
    { upsert: true, new: true }
  );

  const verifyEmailLink = await createVerifyLink( email, randomToken );

  const __fileName = fileURLToPath(import.meta.url);
  const __dirName = path.dirname(__fileName);
  console.log("folder", __dirName);
  const mjmlTemplate = path.join(__dirName, "..", "emails", "email.mjml");
  const mjmltemplateString = await fs.readFile(mjmlTemplate, "utf-8");

  const filledTemplate = ejs.render(mjmltemplateString, {
    token: randomToken,
    link: verifyEmailLink,
  });

  const { html, errors } = mjml2html(filledTemplate, { beautify: true });
  if (errors?.length) {
    console.error("MJML errors:", errors);
  }

  await sendEmail({
    to: email,
    subject: "verify your email",
    html,
  }).catch(console.error);
};



export const createResetPasswordLink = async({userId})=>{
  const randomtoken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(randomtoken).digest("hex");
  await resetPasswordToken.findOneAndDelete({userId});
  await resetPasswordToken.create({
    userId,
    tokenHash
  });
  return `${process.env.FRONTENED_URL}/reset-password/${randomtoken}`
}



export const getForgotPasswordToken = async(token)=>{
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await resetPasswordToken.findOne({tokenHash: tokenHash});
    console.log(user)
    return user;
}