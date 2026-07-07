import { API_BASE_URL } from '../config/api';

// Map for in-flight GET requests to prevent duplicate requests
const activeGetRequests = new Map<string, Promise<Response>>();

/**
 * Custom fetch client with request deduplication and timeouts.
 */
export async function apiFetch(
  endpoint: string,
  init?: RequestInit,
  customTimeout?: number
): Promise<Response> {
  const method = init?.method || 'GET';
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  // Synchronously resolve auth and client context from request headers to avoid Firebase Auth async hangs during cache key generation
  let authContext = '';
  if (init?.headers) {
    const headers = init.headers as Record<string, string>;
    authContext = headers['Authorization'] || headers['authorization'] || headers['X-Authority-Role'] || '';
  }

  // Deduplication Key for GET requests (Method, Full URL/Query parameters, Authentication context)
  const cacheKey = `${method}:${url}:${init?.body ? String(init.body) : ''}:${authContext}`;

  if (method === 'GET' && activeGetRequests.has(cacheKey)) {
    try {
      const response = await activeGetRequests.get(cacheKey)!;
      return response.clone(); // Critical: clone the response to allow multiple reads of the body stream
    } catch (err) {
      throw err;
    }
  }

  const defaultTimeout = customTimeout || (url.includes('/vision/') || url.includes('/upload') ? 60000 : 20000);
  
  let mainTimeoutId: any = null;
  const controller = new AbortController();
  mainTimeoutId = setTimeout(() => controller.abort(), defaultTimeout);

  const fetchPromise = (async () => {
    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      if (mainTimeoutId) {
        clearTimeout(mainTimeoutId);
        mainTimeoutId = null;
      }

      return response;
    } catch (err: any) {
      if (mainTimeoutId) {
        clearTimeout(mainTimeoutId);
        mainTimeoutId = null;
      }

      // Check if browser is offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Offline: Please check your internet connection.');
      }

      // Handle abort (timeout)
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${defaultTimeout / 1000} seconds.`);
      }

      throw err;
    } finally {
      if (mainTimeoutId) {
        clearTimeout(mainTimeoutId);
      }
    }
  })();

  if (method === 'GET') {
    activeGetRequests.set(cacheKey, fetchPromise);
  }

  try {
    const response = await fetchPromise;
    return response.clone(); // Clone the response for the original caller as well
  } finally {
    // Guarantee cache removal in finally block
    if (method === 'GET') {
      activeGetRequests.delete(cacheKey);
    }
  }
}
