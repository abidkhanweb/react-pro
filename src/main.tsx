import { StrictMode, Suspense } from "react";
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"
import { ThemeProviders, QueryProvider } from '@/providers/index'
import { ErrorBoundary } from "@/components/system/ErrorBoundary.tsx"
import { AppFallback } from "@/components/system/AppFallback.tsx";
import App from './App.tsx'
import { Toaster } from "@/components/ui/toaster";
import './index.css'

async function startApp() {
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === "true") {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }
  createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<AppFallback />}>
        <BrowserRouter>
          <QueryProvider>
            <ThemeProviders>
              <App />
              <Toaster />
            </ThemeProviders>
          </QueryProvider>
        </BrowserRouter>
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
);
}

void startApp().catch((error: unknown) => {
  console.error("Application startup failed", error);
  document.getElementById("root")!.textContent = "Could not start the application. Please reload and try again.";
});
