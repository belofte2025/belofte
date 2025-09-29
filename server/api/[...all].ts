import serverless from "serverless-http";
import app from "../src/app"; // your Express app (no app.listen)
export default serverless(app);