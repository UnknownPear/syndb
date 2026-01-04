import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.tsx";
import "./index.css";

// 1. Load the Client ID from your .env file
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!clientId) {
  console.error("🚨 Error: VITE_GOOGLE_CLIENT_ID is missing from .env file!");
}

createRoot(document.getElementById("root")!).render(
  // 2. Wrap the entire App in the Provider
  <GoogleOAuthProvider clientId={clientId || ""}>
    <App />
  </GoogleOAuthProvider>
);