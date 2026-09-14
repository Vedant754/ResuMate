import axios from "axios";
import { reportClientError } from "@/lib/telemetry";

export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error?.message ||
      err.message ||
      "Request failed";
    reportClientError({
      type: "api-error",
      message: `${err.config?.method?.toUpperCase() || "REQUEST"} ${err.config?.url || "unknown"}: ${message}`,
      stack: err.stack,
    });
    return Promise.reject({
      status: err.response?.status,
      message,
      details: err.response?.data?.error?.details,
      original: err,
    });
  }
);
