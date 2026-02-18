import {Google} from "arctic";
import "dotenv/config"

export const google = new Google(
    process.env.GOOGLE_CLIENT_ID,

    process.env.GOOGLE_CLIENT_SECRET,
    // "http://localhost:3008/google/callback"
   " https://full-stack-website-ey10.onrender.com/google/callback"

) 