const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const states = ["disconnected", "connected", "connecting", "disconnecting"];

function buildHealthPayload() {
  const dbState = states[mongoose.connection.readyState] || "unknown";
  const dbReady = mongoose.connection.readyState === 1;

  return {
    status: dbReady ? "ok" : "degraded",
    uptimeSeconds: Number(process.uptime().toFixed(3)),
    timestamp: new Date().toISOString(),
    checks: {
      database: {
        status: dbReady ? "up" : "down",
        state: dbState,
      },
      application: {
        status: "up",
      },
    },
  };
}

router.get("/live", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Number(process.uptime().toFixed(3)),
  });
});

router.get("/ready", async (req, res) => {
  try {
    const isDbReady = mongoose.connection.readyState === 1;

    if (!isDbReady) {
      return res.status(503).json({
        status: "error",
        timestamp: new Date().toISOString(),
        checks: {
          database: {
            status: "down",
            state: states[mongoose.connection.readyState] || "unknown",
          },
        },
      });
    }

    return res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: "up",
          state: "connected",
        },
      },
    });
  } catch (error) {
    return res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      message: "Readiness check failed",
    });
  }
});

router.get("/", (req, res) => {
  const payload = buildHealthPayload();
  const isHealthy = payload.checks.database.status === "up";

  return res.status(isHealthy ? 200 : 503).json(payload);
});

module.exports = router;
