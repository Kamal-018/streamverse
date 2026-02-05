import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credential: true
}))

//limiter
app.use(express.json({ limit: "16kb" }))

app.use(express.urlencoded({ Extended: true, limit: "16kb" }))

//to store temp data
app.use(express.static("public"))

app.use(cookieParser())


//routes

import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"
import likeRouter from "./routes/like.routes.js"
import commentRouter from "./routes/comment.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

import { errorHandler } from "./middlewares/error.middleware.js"

app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/sub", subscriptionRouter)
app.use("/api/v1/dash", dashboardRouter)

app.use(errorHandler)

export { app }