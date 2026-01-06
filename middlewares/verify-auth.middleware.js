import { refreshTokens, verifyJWTtoken } from "../services/auth.services.js";

// middlewares/authMiddleware.js
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  next();
};

export const verifyAuthentication = async (req, res, next) => {
  const accessToken = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;
  req.user = null;

  if (!accessToken && !refreshToken) {
    return next();
  }
  if (accessToken) {
    const decodeToken = verifyJWTtoken(accessToken);
    req.user = decodeToken;
    return next();
  }

  if (refreshToken) {
    try {
      const { newAccessToken, newRefreshToken, user } = await refreshTokens(
        refreshToken
      );

      req.user = user;

      const baseConfig = { httpOnly: true, secure: true };

      res.cookie("access_token", newAccessToken, {
        ...baseConfig,
      });

      res.cookie("refresh_token", newRefreshToken, {
        ...baseConfig,
      });
      return next();
    } catch (error) {
      console.log(error.message);
    }
  }
  return next();
};
