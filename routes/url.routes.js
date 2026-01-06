import {Router} from "express";
import { deleteURL, shortenURL, redirectLink, shortenerPage, editURL, updateURL } from "../controller/url.controller.js"
import { requireAuth, verifyAuthentication } from "../middlewares/verify-auth.middleware.js";

const router = Router();

router.route("/")
    .get(requireAuth, shortenerPage)
router
    .route("/shorten")
    .post(verifyAuthentication, shortenURL)
router
    .route("/delete/:id")
    .get(deleteURL)
router
    .route("/redirect/:shortcode")
    .get(redirectLink)

router
    .route("/edit/:id")
    .get(editURL).post(updateURL);


export default router;