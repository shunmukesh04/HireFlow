import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ClerkProvider } from "@clerk/clerk-react";

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.error("❌ Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables");
  console.error("💡 Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file in the frontend directory");
  
  // Show error message in the UI instead of crashing
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui; padding: 20px;">
        <div style="text-align: center; max-width: 600px;">
          <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 16px;">⚠️ Configuration Error</h1>
          <p style="color: #374151; font-size: 16px; margin-bottom: 8px;">
            Missing Clerk Publishable Key
          </p>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
            Please add <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">VITE_CLERK_PUBLISHABLE_KEY</code> to your <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">frontend/.env</code> file
          </p>
          <p style="color: #6b7280; font-size: 12px;">
            Get your key from <a href="https://dashboard.clerk.com" target="_blank" style="color: #2563eb;">Clerk Dashboard</a>
          </p>
        </div>
      </div>
    `;
  }
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY} 
        afterSignOutUrl="/"
        afterSignUpUrl="/"
        afterSignInUrl="/"
      >
        <App />
      </ClerkProvider>
    </StrictMode>,
  )
}
