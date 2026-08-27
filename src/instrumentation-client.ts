const sentryDisabled =
  process.env.NEXT_PUBLIC_SENTRY_DISABLED === "1" ||
  process.env.CLOUDFLARE === "1";

export function onRouterTransitionStart(href: string, navigationType: string) {
  if (sentryDisabled) return;
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.captureRouterTransitionStart(href, navigationType);
  });
}

if (!sentryDisabled) {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: "https://4ecbb3b441a2193ed2af656ff361ce37@o4511248614096896.ingest.us.sentry.io/4511834664927232",
      integrations: [
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      tracesSampleRate: 1,
      enableLogs: true,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  });
}
