function reportClientError(event) {
  const payload = JSON.stringify({
    type: event.type || "client-error",
    message: event.message || "Unknown client error",
    stack: event.stack,
    url: window.location.href,
    userAgent: navigator.userAgent,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/monitoring/client-events",
      new Blob([payload], { type: "application/json" })
    );
    return;
  }

  fetch("/api/monitoring/client-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

export function installClientMonitoring() {
  window.addEventListener("error", (event) => {
    reportClientError({
      type: "uncaught-error",
      message: event.message,
      stack: event.error?.stack,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    reportClientError({
      type: "unhandled-rejection",
      message: reason?.message || String(reason),
      stack: reason?.stack,
    });
  });
}

export { reportClientError };