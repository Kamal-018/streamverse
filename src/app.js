import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors ({
    origin : process.env.CORS_ORIGIN,
    credential : true
}))

//limiter
app.use(express.json({limit : "16kb"}))

app.use(express.urlencoded({Extended : true, limit : "16kb"}))

//to store temp data
app.use(express.static("public"))

app.use(cookieParser())


//routes

import userRouter from "./routes/user.routes.js"

//middleware usage to get the routes
app.use("/api/v1/users", userRouter)


export {app}