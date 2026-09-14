const os = require("os");

const startedAt = Date.now();
const requestStats = new Map();
const aiStats = new Map();
const recentErrors = [];
const recentClientErrors = [];
let lastCpuUsage = process.cpuUsage();
let lastCpuSampleAt = process.hrtime.bigint();

const MAX_ERROR_SAMPLES = 50;

function increment(map, key, field, value = 1) {
  const current = map.get(key) || { requests: 0, errors: 0, durationMs: 0 };
  current[field] = (current[field] || 0) + value;
  map.set(key, current);
}

function addBounded(list, value) {
  list.push(value);
  if (list.length > MAX_ERROR_SAMPLES) list.shift();
}

function recordRequest({ method, route, statusCode, durationMs }) {
  const key = `${method} ${route}`;
  increment(requestStats, key, "requests");
  increment(requestStats, key, "durationMs", durationMs);
  if (statusCode >= 400) increment(requestStats, key, "errors");
}

function recordAiCall({ operation, model, durationMs, promptTokens, responseTokens, error }) {
  const key = `${operation}:${model}`;
  const current = aiStats.get(key) || {
    operation,
    model,
    calls: 0,
    failures: 0,
    durationMs: 0,
    promptTokens: 0,
    responseTokens: 0,
  };
  current.calls += 1;
  current.durationMs += durationMs;
  current.promptTokens += Number(promptTokens) || 0;
  current.responseTokens += Number(responseTokens) || 0;
  if (error) current.failures += 1;
  aiStats.set(key, current);
}

function recordServerError({ method, url, statusCode, message, stack }) {
  addBounded(recentErrors, {
    at: new Date().toISOString(),
    method,
    url,
    statusCode,
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : stack,
  });
}

function recordClientError({ type, message, stack, url, userAgent }) {
  addBounded(recentClientErrors, {
    at: new Date().toISOString(),
    type,
    message: String(message || "Unknown client error").slice(0, 1000),
    stack: String(stack || "").slice(0, 4000),
    url: String(url || "").slice(0, 1000),
    userAgent: String(userAgent || "").slice(0, 500),
  });
}

function getCpuSnapshot() {
  const now = process.hrtime.bigint();
  const elapsedMicros = Number(now - lastCpuSampleAt) / 1000;
  const usage = process.cpuUsage(lastCpuUsage);
  lastCpuUsage = process.cpuUsage();
  lastCpuSampleAt = now;
  const usedMicros = usage.user + usage.system;

  return {
    percent: elapsedMicros > 0 ? Number(((usedMicros / elapsedMicros) * 100).toFixed(2)) : 0,
    userMs: Math.round(usage.user / 1000),
    systemMs: Math.round(usage.system / 1000),
    cores: os.cpus().length,
  };
}

function getSnapshot(dbState, geminiConfigured, geminiModel) {
  const requests = Array.from(requestStats, ([key, value]) => ({
    route: key,
    ...value,
    averageDurationMs: value.requests
      ? Math.round(value.durationMs / value.requests)
      : 0,
  }));
  const ai = Array.from(aiStats.values()).map((value) => ({
    ...value,
    averageDurationMs: value.calls ? Math.round(value.durationMs / value.calls) : 0,
  }));
  const memory = process.memoryUsage();

  return {
    status: "ok",
    generatedAt: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    startedAt: new Date(startedAt).toISOString(),
    process: {
      pid: process.pid,
      node: process.version,
      environment: process.env.NODE_ENV || "development",
      cpu: getCpuSnapshot(),
      memory: {
        rssBytes: memory.rss,
        heapUsedBytes: memory.heapUsed,
        heapTotalBytes: memory.heapTotal,
        externalBytes: memory.external,
      },
    },
    database: { state: dbState },
    ai: {
      provider: "Google Gemini",
      configured: geminiConfigured,
      defaultModel: geminiModel,
      calls: ai,
    },
    requests,
    errors: {
      server: recentErrors,
      client: recentClientErrors,
    },
  };
}

module.exports = {
  getSnapshot,
  recordAiCall,
  recordClientError,
  recordRequest,
  recordServerError,
};