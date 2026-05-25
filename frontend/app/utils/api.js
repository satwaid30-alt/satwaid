/**
 * Dynamic URL Helpers
 *
 * Solves the mobile/LAN real-time issue:
 * - process.env.NEXT_PUBLIC_API_URL is statically compiled as "localhost:4000"
 * - When a mobile device opens the app via LAN (e.g. http://10.10.11.202:3000),
 *   any hardcoded "localhost:4000" tries to connect to the mobile device itself,
 *   causing all Socket.IO connections and fetch calls to fail.
 *
 * These helpers read window.location.hostname at runtime (on the client) so:
 * - Desktop:  hostname = "localhost"  → http://localhost:4000
 * - Mobile:   hostname = "10.10.11.202" → http://10.10.11.202:4000
 */

const BACKEND_PORT = 4000;

/**
 * Returns the base REST API URL pointing at the backend.
 * Prioritizes the environment variable from .env.local if defined,
 * otherwise dynamically determines it from window.location.hostname.
 */
export function getApiUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:${BACKEND_PORT}`;
  }
  // SSR fallback
  return `http://localhost:${BACKEND_PORT}`;
}

/**
 * Returns the Socket.IO server URL, same logic as getApiUrl().
 */
export function getSocketUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:${BACKEND_PORT}`;
  }
  return `http://localhost:${BACKEND_PORT}`;
}

/**
 * Centrally resolves a shop logo URL, handling absolute paths,
 * base64 data strings, and relative backend upload paths with proper
 * slash normalization.
 */
export function getLogoUrl(url) {
  if (!url) return null;
  let finalUrl = url;
  try {
    if (typeof url === 'string' && (url.startsWith('[') || url.startsWith('{'))) {
      const parsed = JSON.parse(url);
      finalUrl = Array.isArray(parsed) ? parsed[0] : parsed;
    } else if (Array.isArray(url)) {
      finalUrl = url[0];
    }
  } catch (e) {
    // Treat as raw string if JSON parsing fails
  }

  if (!finalUrl) return null;
  if (typeof finalUrl !== 'string') return null;
  if (finalUrl.startsWith('http') || finalUrl.startsWith('data:')) return finalUrl;
  
  // Normalize backslashes to forward slashes
  let cleanUrl = finalUrl.replace(/\\/g, '/');
  
  // Strip redundant 'public/' or '/public/' prefixes
  if (cleanUrl.startsWith('public/')) {
    cleanUrl = cleanUrl.slice(7);
  } else if (cleanUrl.startsWith('/public/')) {
    cleanUrl = cleanUrl.slice(8);
  }
  
  const path = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
  return `${getApiUrl()}${path}`;
}

/**
 * Centrally resolves a general image URL (products, proofs, logos),
 * supporting stringified JSON arrays/objects, array paths, and raw strings.
 */
export function getImageUrl(path) {
  if (!path) return null;
  let finalPath = path;
  try {
    if (typeof path === 'string' && (path.startsWith('[') || path.startsWith('{'))) {
      const parsed = JSON.parse(path);
      finalPath = Array.isArray(parsed) ? parsed[0] : parsed;
    } else if (Array.isArray(path)) {
      finalPath = path[0];
    }
  } catch (e) {
    // Treat as raw string if JSON parsing fails
  }
  
  if (!finalPath) return null;
  if (typeof finalPath !== 'string') return null;
  if (finalPath.startsWith('http') || finalPath.startsWith('data:')) return finalPath;
  
  // Normalize backslashes and strip public prefix
  let cleanUrl = finalPath.replace(/\\/g, '/');
  if (cleanUrl.startsWith('public/')) {
    cleanUrl = cleanUrl.slice(7);
  } else if (cleanUrl.startsWith('/public/')) {
    cleanUrl = cleanUrl.slice(8);
  }
  
  const formattedPath = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
  return `${getApiUrl()}${formattedPath}`;
}

