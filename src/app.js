import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: ProcessingInstruction.env.CORS_ORIGIN
}))

app.use(express.json({ limit: "20kb" }))             //  to handle request from form in json

app.use(express.urlencoded({ limit: "20kb" }))      //to handle the encoded url for space etc

app.use(express.static("public"))                   //to handle files and store it on local

app.use(cookieParser())                             //cookie-parser to do crud opr on client cookie


export { app }