import {Google} from "arctic";
import "dotenv/config"

export const google = new Google(
    process.env.GOOGLE_CLIENT_ID,

    process.env.GOOGLE_CLIENT_SECRET,
    process.env.FRONTEND_URL,
   
) 
console.log("Client ID:", process.env.GOOGLE_CLIENT_ID);
console.log("Client Secret:", process.env.GOOGLE_CLIENT_SECRET);