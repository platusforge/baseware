import React from "react";
import ReactDOM from "react-dom/client";
import posthog from "posthog-js";
import * as Sentry from "@sentry/react";
import { App } from "./app";
import "./styles/global.css";

const posthogKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
if (posthogKey) {
  posthog.init(posthogKey, { api_host: "https://us.i.posthog.com" });
}

const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (sentryDsn) {
  Sentry.init({ dsn: sentryDsn });
  window.addEventListener("error", (event) => {
    Sentry.captureException(event.error ?? event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    Sentry.captureException(event.reason);
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
