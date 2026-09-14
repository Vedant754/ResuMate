const monitoring = require("../services/monitoring");

function requestMetrics(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : req.path;
    monitoring.recordRequest({
      method: req.method,
      route,
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
}

module.exports = { requestMetrics };