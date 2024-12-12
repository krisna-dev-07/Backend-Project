import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from './app.js'
// configure dotenv -experimental feature is use in script-"-r dotenv/config             --experimental-json-modules"
dotenv.config({
    path: './.env'
})



connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port: ${process.env.PORT}`);

        })
    })
    // then is a method that handles the resolved promise. It is executed if the promise returned by connectDB() resolves successfully
    .catch((err) => {
        console.error("MongoDB connect failure:", err.message);
    });
