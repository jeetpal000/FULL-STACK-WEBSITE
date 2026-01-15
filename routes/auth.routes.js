import { Router } from "express";
import multer from "multer"
import path from "path"
import * as authControllers from "../controller/auth.controller.js";
const router = Router();

router
  .route("/register")
  .get(authControllers.getRegisterPage)
  .post(authControllers.postRegistration);

router
  .route("/login")
  .get(authControllers.getLoginPage)
  .post(authControllers.postLogin);

router.route("/me").get(authControllers.getMe);

router.route("/logout").get(authControllers.logoutUser);
router.route("/profile").get(authControllers.getProfilePage);
router.route("/verify-email").get(authControllers.getVerifyEmailPage);
router
  .route("/resend-verification")
  .get(authControllers.resendverificationLink);
router.route("/verify-email-token").get(authControllers.getVerifyToken);

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb)=>{
     cb(null, "public/uploads/avatar");
  },
  filename: (req, file, cb)=>{
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${Math.random()}${ext}`);
  },
  
});

const avatarFileFilter = (req, file, cb)=>{
  if(file.mimetype.startsWith("image/")){
    cb(null, true)
  }else{
    cb(new Error("Only image files are allowed"), false);
  }
};
const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: {fileSize: 5*1024*1024},
});

router
  .route("/edit-profile")
  .get(authControllers.editProfileNamePage)
  // .post(authControllers.editProfileName);
  .post(avatarUpload.single("avatar"), authControllers.editProfileName)
router
  .route("/change-password")
  .get(authControllers.editPasswordPage)
  .post(authControllers.postchangePassword);
router.route("/reset-password").get(authControllers.getResetPasswordPage).post(authControllers.getResetPassword);
router.route("/reset-password/:token").get(authControllers.getForgotPasswordPage).post(authControllers.getForgotPassword);
router.route("/google").get(authControllers.getGoogleLoginPage);
router.route("/google/callback").get(authControllers.getGoogleLoginCallback)
export const authRoutes = router;
