export function initSentry() {
  try {
    // Initialize Sentry only when DSN is provided in env at build/runtime
    const dsn =
      (typeof import.meta !== "undefined" &&
        (import.meta.env as any)?.VITE_SENTRY_DSN) ||
      (window as any).__SENTRY_DSN__;
    if (!dsn) return;

    // Use an indirect dynamic import to prevent Vite from statically analyzing
    // and trying to resolve the dependency at build time when it's not installed.
    // This keeps the code safe when @sentry/browser isn't present in dev env.
    const dynamicImport = new Function("id", "return import(id)");

    dynamicImport("@sentry/browser")
      .then((Sentry: any) => {
        try {
          Sentry.init({ dsn, tracesSampleRate: 0.1 });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("Sentry init failed:", err);
        }
      })
      .catch((err: any) => {
        // eslint-disable-next-line no-console
        console.warn("Sentry failed to load (optional):", err);
      });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("Sentry init error", e);
  }
}
