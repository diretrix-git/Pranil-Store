import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import { Toaster } from "sonner";
import "./index.css";
import App from "./App";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Theme Clerk's hosted auth UI to match MarketHub brand
const clerkAppearance = {
  variables: {
    colorPrimary: "#7c3aed",
    colorPrimaryHover: "#6d28d9",
    borderRadius: "0.75rem",
    fontFamily: "'Inter', sans-serif",
  },
  elements: {
    formButtonPrimary:
      "bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-opacity shadow-md shadow-violet-200",
    card: "shadow-2xl border border-slate-100 rounded-2xl",
    headerTitle: "font-black text-slate-900",
    socialButtonsBlockButton:
      "border border-slate-200 hover:bg-slate-50 transition-colors font-medium",
    formFieldInput:
      "border-slate-200 focus:ring-2 focus:ring-violet-400 focus:border-violet-400 rounded-lg",
    footerActionLink: "text-violet-600 hover:text-violet-700 font-semibold",
  },
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={publishableKey}
      afterSignOutUrl="/"
      afterSignInUrl="/"
      appearance={clerkAppearance}
    >
      <App />
      {/* Global toast notifications — available everywhere via toast() */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            fontFamily: "'Inter', sans-serif",
            borderRadius: "0.75rem",
            fontSize: "0.875rem",
          },
          duration: 4000,
        }}
      />
    </ClerkProvider>
  </StrictMode>,
);
