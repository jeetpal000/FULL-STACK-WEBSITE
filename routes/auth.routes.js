import { Router } from "express";
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
router
  .route("/edit-profile")
  .get(authControllers.editProfileNamePage)
  .post(authControllers.editProfileName);
router
  .route("/change-password")
  .get(authControllers.editPasswordPage)
  .post(authControllers.postchangePassword);
router.route("/reset-password").get(authControllers.getResetPasswordPage).post(authControllers.getResetPassword);
router.route("/reset-password/:token").get(authControllers.getForgotPasswordPage).post(authControllers.getForgotPassword);
export const authRoutes = router;
