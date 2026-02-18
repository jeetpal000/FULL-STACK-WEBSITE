import cookieParser from 'cookie-parser'; 
import express from "express";
import flash from "connect-flash";
import 'dotenv/config'; 
import path from "path"; 
import requestIp from "request-ip"; 
import session from "express-session"; 
import urlRoutes from "./routes/url.routes.js"; 

import { fileURLToPath } from "url"; 
import { authRoutes } from "./routes/auth.routes.js"; 
import { connectServer } from "./utils/db.js"; 
import {verifyAuthentication } from "./middlewares/verify-auth.middleware.js";  
// import dotenv from "dotenv";
// dotenv.config();


const app = express();  
const __fileName = fileURLToPath(import.meta.url); 
const __dirName = path.dirname(__fileName); 
app.use(express.json()); 
app.use(express.urlencoded({extended: true})); 
app.use(express.static(path.join(__dirName, "public"))); 
app.use(cookieParser()); 

app.use(session({
    secret: "my-secret",
    resave: true,
    saveUninitialized: false,
}));
app.use(flash());
app.use(requestIp.mw()); 

app.use(verifyAuthentication);

app.use((req, res, next)=>{
    res.locals.user = req.user;
    return next();
});


app.set("view engine", "ejs");
app.set("views", path.join(__dirName, "views"))


app.use(authRoutes);
app.use(urlRoutes);

app.use((req, res)=>{
    res.status(400).send("<h1>Error page</h1>")
})

const PORT = process.env.PORT || 3001;
// console.log(PORT)

connectServer().then(
    app.listen(PORT, ()=>{
        console.log(`http://localhost:${PORT}`)
    })
);