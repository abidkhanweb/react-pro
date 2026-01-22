import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"
import { ThemeProviders, QueryProvider } from '@/providers/index'
import App from './App.tsx'
import { Toaster } from "@/components/ui/toaster";
import './index.css'

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryProvider>
        <ThemeProviders>
          <App />
          <Toaster />
        </ThemeProviders>
      </QueryProvider>
    </BrowserRouter>
  </StrictMode>
);
