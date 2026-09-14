const express = require("express");
const mongoose = require("mongoose");

const env = require("../config/env");
const monitoring = require("../services/monitoring");

const router = express.Router();

function protectMonitoring(req, res, next) {
  if (env.monitoringToken && req.get("x-monitoring-token") !== env.monitoringToken) {
    return res.status(401).json({ error: { message: "Monitoring access denied" } });
  }
  if (env.isProd && !env.monitoringToken) {
    return res.status(503).json({ error: { message: "Monitoring token is not configured" } });
  }
  next();
}

router.get("/", protectMonitoring, (req, res) => {
  res.json(
    monitoring.getSnapshot(
      ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState] || "unknown",
      Boolean(env.geminiApiKey),
      env.geminiModel
    )
  );
});

router.post("/client-events", (req, res) => {
  const { type, message, stack, url, userAgent } = req.body || {};
  if (!message) return res.status(400).json({ error: { message: "message is required" } });

  monitoring.recordClientError({ type, message, stack, url, userAgent });
  res.status(202).json({ ok: true });
});

module.exports = router;