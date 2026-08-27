import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DISABLED !== "1") {
  Sentry.init({
    dsn: "https://4ecbb3b441a2193ed2af656ff361ce37@o4511248614096896.ingest.us.sentry.io/4511834664927232",
    tracesSampleRate: 1,
    enableLogs: true,
  });
}
