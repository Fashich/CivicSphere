import * as React from "react";

type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  State
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Uncaught error in ErrorBoundary:", error, info);
    try {
      sessionStorage.setItem("lastErrorMessage", error?.message || "");
      sessionStorage.setItem("lastErrorStack", error?.stack || "");
      sessionStorage.setItem("lastErrorUrl", window.location.href);
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
          <div className="max-w-xl text-center">
            <h1 className="text-2xl font-bold mb-4">Terjadi kesalahan</h1>
            <p className="text-muted-foreground mb-6">
              Ada sesuatu yang salah pada aplikasi. Silakan muat ulang halaman
              atau{" "}
              <a href="/support" className="underline text-primary">
                hubungi support
              </a>{" "}
              jika masalah berlanjut.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded bg-primary text-primary-foreground"
              >
                Muat Ulang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}
