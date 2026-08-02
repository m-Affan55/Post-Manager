/**
 * Centralised API configuration.
 *
 * In development   → VITE_API_URL is unset → falls back to http://localhost:8000
 * In production    → set VITE_API_URL=https://api.yourapp.com in your CI/CD env
 *
 * This means you never need to touch individual service files to deploy.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
