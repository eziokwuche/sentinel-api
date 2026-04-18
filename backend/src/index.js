const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./config/db");
const healthRoutes = require("./routes/healthRoutes");
const endpointRoutes = require("./routes/endpointRoutes");
const checkRoutes = require("./routes/checkRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const cronJobs = require("./scheduler/cronJobs");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/health", healthRoutes);
app.use("/api/endpoints", endpointRoutes);
app.use("/api/checks", checkRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Sentinel API backend is running." });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const startServer = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing. Add it to your .env file.");
    }

    await pool.query("SELECT 1");
    console.log("PostgreSQL connection established.");

    app.listen(port, async () => {
      console.log(`Server listening on port ${port}`);
      await cronJobs.initializeScheduler();
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
