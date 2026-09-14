# Monitoring

The project now includes lightweight monitoring for the Express API and React client.

## What is captured

- Request count, status errors, duration, and average duration per route.
- Process uptime, Node version, CPU sample percentage, RSS, heap, and external memory.
- MongoDB connection state.
- Gemini provider, configured model, call count, failures, latency, prompt tokens, and response tokens for resume and job-description analysis.
- The latest 50 server errors and client errors (uncaught errors, unhandled promise rejections, and failed API requests).

Request and error samples are held in memory and reset when the server restarts. No resume text, prompts, API keys, cookies, or AI responses are stored in telemetry.

## Endpoints

`GET /api/monitoring` returns the complete operational snapshot. In development it is available directly. In production set `MONITORING_TOKEN` and send it as:

```powershell
Invoke-RestMethod http://localhost:5000/api/monitoring -Headers @{ "x-monitoring-token" = $env:MONITORING_TOKEN }
```

`POST /api/monitoring/client-events` is used by the client automatically. It accepts a small event payload containing `type`, `message`, `stack`, `url`, and `userAgent`.

`GET /api/health` remains the lightweight liveness check for load balancers. Use `/api/monitoring` for diagnostics.

## Production configuration

Add a strong random value to the server environment:

```env
MONITORING_TOKEN=replace-with-a-long-random-value
```

The monitoring endpoint returns `503` in production if this variable is missing. It returns `401` for an invalid token.

## Reading the data

Useful first checks:

1. `process.memory.heapUsedBytes` and `process.memory.rssBytes` identify memory growth.
2. `process.cpu.percent` is the process CPU used since the previous snapshot request.
3. `requests[].errors` and `requests[].averageDurationMs` identify failing or slow routes.
4. `ai.calls[].failures`, token totals, and latency identify Gemini availability and usage pressure.
5. `errors.server` and `errors.client` provide the recent error context needed to reproduce issues.

For durable history, alerting, and dashboards, export this snapshot to a metrics backend such as Prometheus/Grafana or an error platform such as Sentry. The registry is intentionally isolated in `server/src/services/monitoring.js` so that exporter can be added without changing route handlers.