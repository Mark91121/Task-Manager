"use client";

import { ToastProvider } from "./ToastProvider";

// Single place to stack app-wide client providers (toasts, future
// theming/auth context, etc.) so layout.js stays a clean server component.
export default function Providers({ children }) {
  return <ToastProvider>{children}</ToastProvider>;
}
