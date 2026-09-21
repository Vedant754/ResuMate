const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const env = require("./config/env");
const { connectDB } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { requestMetrics } = require("./middleware/monitoring");
const monitoring = require("./services/monitoring");

const healthRouter = require("./routes/health");
const authRouter = require("./routes/auth");
const resumesRouter = require("./routes/resumes");
const dashboardRouter = require("./routes/dashboard");
const insightsRouter = require("./routes/insights");
const versionsRouter = require("./routes/versions");
const historyRouter = require("./routes/history");
const JobDescriptionRouter = require("./routes/jobDescription");
const monitoringRouter = require("./routes/monitoring");
const {
  client,
  register,
  httpRequestsTotal,
  httpRequestDuration,
  mongoStatus,
  mongoOperationsTotal,
  mongoOperationDuration,
  mongoErrorsTotal, 
} = require("./metrics");

const app = express();

// const register = new client.Registry();
// client.collectDefaultMetrics({register});


// const mongoOperationsTotal = new client.Counter({
//   name: "mongodb_operations_total",
//   help: "Total MongoDB operations",
//   labelNames: ["operation"],
//   registers: [register],
// });

// const mongoErrorsTotal = new client.Counter({
//   name: "mongodb_errors_total",
//   help: "Total MongoDB operation failures",
//   labelNames: ["operation"],
//   registers: [register],
// });

// const mongoOperationDuration = new client.Histogram({
//   name: "mongodb_operation_duration_seconds",
//   help: "MongoDB operation duration in seconds",
//   labelNames: ["operation"],
//   buckets: [
//     0.001,
//     0.005,
//     0.01,
//     0.025,
//     0.05,
//     0.1,
//     0.25,
//     0.5,
//     1,
//     2.5,
//     5,
//   ],
//   registers: [register],
// });

// const mongoStatus = new client.Gauge({
//   name: "mongodb_status",
//   help: "MongoDB connection status (1 = connected, 0 = disconnected)",
//   registers: [register],
// });

// middleware to record metrics for each request
app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {

    //   if (req.path === "/metrics") {
    //   return next();
    // }
    const duration =
      Number(process.hrtime.bigint() - start) / 1e9;

    const route =
      req.route?.path ||
      req.baseUrl ||
      "unknown";

    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);

    httpRequestDuration.observe(
      labels,
      duration
    );
  });

  next();
});

// Gemini service metrics
// client.collectDefaultMetrics({register: register_gemini});

// Route for metrics endpoint
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);

    const metrics = await register.metrics();

    res.send(metrics);
  } catch (error) {
    console.error("Failed to generate Prometheus metrics:", error);

    res.status(500).send("Failed to generate metrics");
  }
});



app.set("trust proxy", 1);
app.use(
  cors({
    origin: true, // reflect request origin — allows everything while keeping credentials working
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(requestMetrics);
if (!env.isProd) app.use(morgan("dev"));

app.use("/api/health", healthRouter);
app.use("/api/monitoring", monitoringRouter);
app.use("/api/auth", authRouter);
app.use("/api/resumes", resumesRouter);
app.use("/api/job-description", JobDescriptionRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/insights", insightsRouter);
app.use("/api/versions", versionsRouter);
app.use("/api/history", historyRouter);

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await connectDB(mongoStatus, mongoOperationDuration, mongoOperationsTotal, mongoErrorsTotal);
    app.listen(env.port, () => {
      console.log(`Server listening on http://localhost:${env.port} (${env.nodeEnv})`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  monitoring.recordServerError({
    statusCode: 500,
    message: reason?.message || String(reason),
    stack: reason?.stack,
  });
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  monitoring.recordServerError({
    statusCode: 500,
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

start();

module.exports = app;
