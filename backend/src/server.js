import dotenv from "dotenv";
import app from "./app.js";
import "@dotenvx/dotenvx/config";

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
