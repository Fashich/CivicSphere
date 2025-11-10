import "./global.css";

import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Communities from "./pages/Communities";
import Projects from "./pages/Projects";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Features from "./pages/Features";
import Join from "./pages/Join";
import Blog from "./pages/Blog";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import GlobalMap from "./pages/GlobalMap";
import Chat from "./pages/Chat";
import GlobalCollaboration from "./pages/GlobalCollaboration";

const queryClient = new QueryClient();

import { ThemeProvider } from "@/lib/theme";
import ThemeToggle from "@/components/ThemeToggle";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initSentry } from "@/lib/sentry";
import { I18nProvider } from "@/lib/i18n";

const App = () => {
  useEffect(() => {
    initSentry();

    // Filter out noisy/harmless logs from third-party SDKs running in iframe/editor.
    const originalWarn = console.warn.bind(console);
    const originalError = console.error.bind(console);

    const suppressedPatterns = [
      "Overwriting modules/imageResize",
      "Attempt to read an array index",
      "Invalid created_at, expecting 10-digit Unix timestamp",
      "Could not get cookie",
      "Could not set cookie",
      "IFrame evaluation timeout",
      "Could not evaluate in iframe",
      "TextSelection endpoint not pointing",
      "start, user-abort",
    ];

    console.warn = (...args: any[]) => {
      try {
        const msg = String(args[0] ?? "");
        if (suppressedPatterns.some((p) => msg.includes(p))) return;
      } catch (_) {}
      originalWarn(...args);
    };

    console.error = (...args: any[]) => {
      try {
        const msg = String(args[0] ?? "");
        if (suppressedPatterns.some((p) => msg.includes(p))) return;
      } catch (_) {}
      originalError(...args);
    };

    const onError = (event: ErrorEvent) => {
      // Log global errors (we still suppress known noisy ones above)
      // eslint-disable-next-line no-console
      console.error("Global error caught:", event.error || event.message);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      // eslint-disable-next-line no-console
      console.error("Unhandled promise rejection:", event.reason);
      try {
        event.preventDefault();
      } catch (_) {}
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection as any);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener(
        "unhandledrejection",
        onUnhandledRejection as any,
      );
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  return (
    <ErrorBoundary>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/communities" element={<Communities />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/global-map" element={<GlobalMap />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/global-collaboration" element={<GlobalCollaboration />} />

                  <Route path="/about" element={<About />} />
                  <Route path="/features" element={<Features />} />
                  <Route path="/join" element={<Join />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />

                  <Route path="/profile" element={<Profile />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
