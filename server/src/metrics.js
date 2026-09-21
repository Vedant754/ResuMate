const client = require("prom-client");
const register = new client.Registry();


// ==========================================
// DEFAULT NODE.JS METRICS
// ==========================================

client.collectDefaultMetrics({
  register,
  timeout: 5000,
});


// ==========================================
// HTTP METRICS
// ==========================================

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [
    0.005,
    0.01,
    0.025,
    0.05,
    0.1,
    0.25,
    0.5,
    1,
    2.5,
    5,
    10,
  ],
  registers: [register],
});


// ==========================================
// MONGODB METRICS
// ==========================================

const mongoStatus = new client.Gauge({
  name: "mongodb_status",
  help: "MongoDB connection status (1 = connected, 0 = disconnected)",
  registers: [register],
});

const mongoOperationsTotal = new client.Counter({
  name: "mongodb_operations_total",
  help: "Total MongoDB operations",
  labelNames: ["operation"],
  registers: [register],
});

const mongoOperationDuration = new client.Histogram({
  name: "mongodb_operation_duration_seconds",
  help: "MongoDB operation duration in seconds",
  labelNames: ["operation"],
  buckets: [
    0.001,
    0.005,
    0.01,
    0.025,
    0.05,
    0.1,
    0.25,
    0.5,
    1,
    2.5,
    5,
  ],
  registers: [register],
});

const mongoErrorsTotal = new client.Counter({
  name: "mongodb_errors_total",
  help: "Total MongoDB operation failures",
  labelNames: ["operation"],
  registers: [register],
});


// ==========================================
// GEMINI METRICS
// ==========================================

const geminiRequestsTotal = new client.Counter({
  name: "gemini_requests_total",
  help: "Total Gemini API requests",
  labelNames: ["model"],
  registers: [register],
});

const geminiErrorsTotal = new client.Counter({
  name: "gemini_errors_total",
  help: "Total Gemini API errors",
  labelNames: ["model", "status_code"],
  registers: [register],
});

const geminiRequestDuration = new client.Histogram({
  name: "gemini_request_duration_seconds",
  help: "Gemini API request duration in seconds",
  labelNames: ["model"],
  buckets: [
    0.1,
    0.25,
    0.5,
    1,
    2.5,
    5,
    10,
    20,
    30,
    60,
  ],
  registers: [register],
});

const geminiTokensTotal = new client.Counter({
  name: "gemini_tokens_total",
  help: "Total Gemini tokens consumed",
  labelNames: ["model", "type"],
  registers: [register],
});


module.exports = {
  client,
  register,

  // HTTP
  httpRequestsTotal,
  httpRequestDuration,

  // MongoDB
  mongoStatus,
  mongoOperationsTotal,
  mongoOperationDuration,
  mongoErrorsTotal,

  // Gemini
  geminiRequestsTotal,
  geminiErrorsTotal,
  geminiRequestDuration,
  geminiTokensTotal,
};