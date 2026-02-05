
import dotenv from "dotenv" //maybe resolved in this node version
import connectDB from "./db/index.js"
import { app } from "./app.js"


dotenv.config({
    path: './.env'
})


import fs from "fs"

const tempDir = "./public/temp";
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

connectDB()

    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`server is running at port : ${process.env.PORT}`)
        })
    })

    .catch((err) => {
        console.log("mongodb connection failed", err)
    })