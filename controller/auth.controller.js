import {
  isValidEmail,
  // oauthUserAccount,
  resetPasswordToken,
  sessionSchemaAuth,
  UrlShortener,
  User,
} from "../models/schema.js";
import {
  // clearUserSession,
  createAccessToken,
  createRefreshToken,
  createResetPasswordLink,
  createSession,
  // findUserById,
  getForgotPasswordToken,
  // generateToken,
  hashPassword,
  resendverificationLinkgenerator,
  verifyPassword,
} from "../services/auth.services.js";
import {
  forgotPasswordSchema,
  loginUserSchema,
  regitserUserSchema,
  resetPasswordSchema,
  verifPasswordSchema,
} from "../validators/auth-validation.js";
import "dotenv/config";
import { getHtmlFromMjmlTemplate } from "../lib/get-html-from-mjml-template.js";
import { sendEmail } from "../lib/nodemailer.js";
import { decodeIdToken, generateCodeVerifier, generateState } from "arctic";
import { google } from "../lib/oauth/google.js";

export const getRegisterPage = (req, res) => {
  return res.render("../views/auth/register.ejs", {
    errors: req.flash("errors"),
  });
};

export const getLoginPage = (req, res) => {
  res.render("auth/login", { errors: req.flash("errors") });
};

export const postRegistration = async (req, res) => {
  const { data, error } = regitserUserSchema.safeParse(req.body);
  console.log("error", error, "data", data)
  if (error) {
    const zodMsg = error.issues[0].message;
    req.flash("errors", zodMsg);

    return res.redirect("/register");
  }

  const { name, email, password } = data;

  const userExist = await User.findOne({ email });
  if (userExist) {
    req.flash("errors", "User already exists");
    return res.redirect("/register");
  }

  try {
    const hashedPassword = await hashPassword(password);

    // ✅ Save new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      isEmailValid: false,
    });

    // ✅ Create session for new user
    const session = await createSession(newUser._id, {
      ip: req.clientIp,
      userAgent: req.headers["user-agent"],
    });

    // ✅ Generate tokens
    const accessToken = createAccessToken({
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      sessionId: session._id,
    });
    const refreshToken = createRefreshToken(session._id.toString());

    const baseConfig = { httpOnly: true, secure: true };

    // ✅ Set cookies
    res.cookie("access_token", accessToken, baseConfig);
    res.cookie("refresh_token", refreshToken, baseConfig);

    await resendverificationLinkgenerator({ email });
    // ✅ Redirect to home (auto-login)
    return res.render("auth/verifyEmail", { email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const postLogin = async (req, res) => {
  try {
    const { data, error } = loginUserSchema.safeParse(req.body);

    if (error) {
      req.flash("errors", error.issues[0].message);
      return res.redirect("/login");
    }

    const { email, password } = data;

    const existUser = await User.findOne({ email });

    if (!existUser) {
      // Manual login → user not found → redirect to register
      req.flash("errors", "User not found. Please register first.");
      return res.redirect("/register");
    }

    // If user exists but registered via Google (password = null)
    if (!existUser.password) {
      req.flash("errors", "This account is linked with Google. Please login with Google.");
      return res.redirect("/login");
    }

    const isValid = await verifyPassword(password, existUser.password);
    if (!isValid) {
      req.flash("errors", "Invalid password");
      return res.redirect("/login");
    }

    // Create session
    const session = await createSession(existUser._id, {
      ip: req.clientIp,
      userAgent: req.headers["user-agent"],
    });

    const accessToken = createAccessToken({
      id: existUser._id,
      name: existUser.name,
      email: existUser.email,
      isEmailValid: false,
      sessionId: session._id,
    });

    const refreshToken = createRefreshToken(session._id);

    const baseConfig = { httpOnly: true, secure: process.env.NODE_ENV === "production" };

    res.cookie("access_token", accessToken, baseConfig);
    res.cookie("refresh_token", refreshToken, baseConfig);

    res.redirect("/");
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getMe = (req, res) => {
  if (!req.user) return res.send("you are not logged in");
  return res.send(`<h1>Hey ${req.user.name} - ${req.user.email}</h1>`);
};

export const logoutUser = async (req, res) => {
  // clear server-side user info for this request
  const sessionId = req.user?.sessionId;
  if (sessionId) {
    await sessionSchemaAuth.findByIdAndUpdate(sessionId, { valid: false });
  }
  req.user = null;
  res.locals.user = null;
  res.locals.isLoggedIn = false;

  // clear the cookie that holds the JWT
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // path: '/', // include if you set a specific path when creating the cookie
  });
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // path: '/', // include if you set a specific path when creating the cookie
  });
  await sessionSchemaAuth.findOneAndDelete(sessionId);

  return res.redirect("/login");
};

// get Profile Page

export const getProfilePage = async (req, res) => {
  if (!req.user) return res.send("Not logged in");
  // console.log("req user",req.user)

  const user = await User.findById(req.user.id);
  // console.log("user",user)
  if (!user) return res.redirect("/login");
  const userShortLinks = await UrlShortener.find({ userId: user._id });
  // console.log("usershortlinks",userShortLinks.length)

  return res.render("auth/profile", {
    user: {
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      isVerified: user.isEmailValid,
      links: userShortLinks,
    },
  });
};

// resendverificationLink
export const resendverificationLink = async (req, res) => {
  if (!req.user) return res.redirect("/");

  await resendverificationLinkgenerator({ email: req.user.email });
  return res.redirect("/verify-email");
};

// getVerifyEmailPage

export const getVerifyEmailPage = async (req, res) => {
  if (!req.user) return res.send("not logged in");
  // console.log(req.user.isEmailValid)
  const token = resendverificationLinkgenerator.randomToken;

  return res.render("auth/verifyEmail", {
    email: req.user.email,
    token,
  });
};

// verify token

export const getVerifyToken = async (req, res) => {
  const { token, email } = req.query;
  //  const { token } = req.query;
  const record = await isValidEmail.findOne({ token });
  if (!record) {
    return res.status(400).send("Invalid or expired token");
  }
  await User.updateOne(
    { email: record.email },
    { $set: { isEmailValid: true } }
  );
  await isValidEmail.deleteMany({ email: record.email });
  return res.redirect("/profile");
};

export const editProfileNamePage = async (req, res) => {
  if (!req.user) return res.redirect("/");

  const user = await User.findById(req.user.id);

  return res.render("auth/edit-profile-page", { name: user.name });
};

export const editProfileName = async (req, res) => {
  if (!req.user) return res.redirect("/");

  // console.log("req.user:", req.user);
  // console.log("req.body:", req.body);

  const { name } = req.body;

  try {
    await User.findOneAndUpdate(
      { email: req.user.email },
      { name },
      { new: true }
    );
    res.redirect("/profile");
  } catch (error) {
    console.error("Error updating username: ", error);
    res.status(500).send("Something went wrong");
  }
};

// editPasswordPage
export const editPasswordPage = async (req, res) => {
  if (!req.user) return res.redirect("/");
  return res.render("auth/editPasswordPage", {
    errors: req.flash("errors"),
    success: req.flash("success"),
  });
};

// postchangePassword
export const postchangePassword = async (req, res) => {
  if (!req.user) return res.redirect("/");

  const { data, error } = verifPasswordSchema.safeParse(req.body);
  // console.log("data", req.body)
  if (error) {
    const zodMsg = error.issues[0].message;
    req.flash("errors", zodMsg);
    return res.redirect("/change-password");
  }
  const { oldpassword, newpassword } = data;
  const user = await User.findOne({ email: req.user.email });

  const isValid = await verifyPassword(oldpassword, user.password);
  if (!isValid) {
    req.flash("errors", "Current Password that you entered is invalid");
    return res.redirect("/change-password");
  }
  const newHashPassword = await hashPassword(newpassword);
  await User.findOneAndUpdate(
    { email: req.user.email },
    { password: newHashPassword },
    { new: true }
  );
  req.flash("success", "Your password has been changed successfully!");
  return res.redirect("/change-password");
};

// getResetPasswordPage

export const getResetPasswordPage = async (req, res) => {
  return res.render("auth/resetPage", {
    formSubmitted: req.flash("formSubmitted")[0],
    errors: req.flash("errors"),
    success: req.flash("success"),
  });
};

// getForgotPasswordPage
export const getResetPassword = async (req, res) => {
  const { data, error } = forgotPasswordSchema.safeParse(req.body);
  // console.log(req.body)
  // console.log(error)
  if (error) {
    const zodMsg = error.issues[0].message;
    req.flash("errors", zodMsg);
    return res.redirect("/reset-password");
  }
  const user = await User.findOne({ email: data.email });
  // console.log(user)
  if (!user) {
    req.flash("errors", "Please enter valid email");
    return res.redirect("/reset-password");
  }
  const resetPasswordLink = await createResetPasswordLink({
    userId: user._id,
  });
  const html = await getHtmlFromMjmlTemplate("resetPasswordEmail", {
    name: user.name,
    link: resetPasswordLink,
  });
  await sendEmail({
    to: user.email,
    subject: "Reset Your Password",
    html,
  }).catch(console.error);
  req.flash("success", "Check your email forgetting password");
  req.flash("formSubmitted", true);
  return res.redirect("/reset-password");
};

// getForgotPasswordPage
export const getForgotPasswordPage = async (req, res) => {
  const { token } = req.params;
  const passwordResetData = await getForgotPasswordToken(token);
  if (!passwordResetData) {
    return res.send("Token is expired or invalid");
  }

  return res.render("auth/resetPasswordPage", {
    errors: req.flash("errors"),
    token,
    success: req.flash("success"),
  });
};

// // getForgotPassword
export const getForgotPassword = async (req, res) => {
  const { token } = req.params;

  // 1. Verify token
  const passwordResetData = await getForgotPasswordToken(token);
  if (!passwordResetData) {
    req.flash("errors", "Password token is not matching");
    return res.redirect(`/reset-password/${token}`);
  }

  // 2. Validate input
  const { data, error } = resetPasswordSchema.safeParse(req.body);
  if (error) {
    const zodMsg = error.issues[0].message;
    req.flash("errors", zodMsg);
    return res.redirect(`/reset-password/${token}`);
  }

  const { newpassword } = data;

  // 3. Find user
  const user = await User.findById(passwordResetData.userId);
  if (!user) {
    req.flash("errors", "User not found");
    return res.redirect(`/reset-password/${token}`);
  }

  // 4. Update password
  const newHashPassword = await hashPassword(newpassword);
  user.password = newHashPassword;
  await user.save();

  // 5. Delete token   

  await resetPasswordToken.findOneAndDelete({ tokenHash: passwordResetData.tokenHash });

  req.flash("success", "Your password has been changed successfully!");
  return res.redirect("/login");
};

// getGoogleLoginPage
export const getGoogleLoginPage = async (req, res)=>{
  if(req.user) return res.redirect("/");
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "profile",
    "email",
  ]);
  const cookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" ? true: false, // dev mein false
  maxAge: 10 * 60 * 1000,
  sameSite: "lax"
};


  res.cookie("google_oauth_state", state, cookieConfig);
  res.cookie("google_code_verifier", codeVerifier, cookieConfig);
  res.redirect(url.toString());
}

// getGoogleLoginCallback
export const getGoogleLoginCallback = async (req, res) => {
  const { code, state } = req.query;
  const { google_oauth_state: storedState, google_code_verifier: codeVerifier } = req.cookies;

  if (!code || !state || state !== storedState) {
    return res.send("❌ Invalid login attempt");
  }

  let tokens;
  try {
    tokens = await google.validateAuthorizationCode(code, codeVerifier);
  } catch (err) {
    console.error("Google token error:", err);
    return res.send("❌ Token exchange failed");
  }

  const claims = decodeIdToken(tokens.idToken());
  const { sub: googleUserId, name, email } = claims;

  let user = await User.findOne({ email });

  if (!user) {
    // Auto‑create user if not exist
    user = await User.create({
      name,
      email,
      password: null,
      googleId: googleUserId,
      provider: "google",
      isEmailValid: true,
    });
  } else if (!user.googleId) {
    // Link existing local account with Google
    user.googleId = googleUserId;
    user.provider = "google";
    await user.save();
  }

  // Set session
  req.session.userId = user._id;

  // Redirect to home
  res.redirect("/");
};
