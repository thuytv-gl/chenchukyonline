// src/lib/server/logging.ts
import type { Handle } from '@sveltejs/kit';

interface RequestLoggerOptions {
  logBody?: boolean;
  logHeaders?: boolean;
  logParams?: boolean;
  logCookies?: boolean;
}

export function createRequestLogger(options: RequestLoggerOptions = {}): Handle {
  const { 
    logBody = true, 
    logHeaders = false, 
    logParams = true,
    logCookies = false 
  } = options;
  
  return async ({ event, resolve }) => {
    const requestId = crypto.randomUUID();
    const method = event.request.method;
    const url = event.url.toString();
    const path = event.url.pathname;
    const start = performance.now();
    
    console.log(`[${requestId}] Request: ${method} ${path}`);
    
    if (logParams && event.url.search) {
      const params = Object.fromEntries(event.url.searchParams);
      console.log(`[${requestId}] Query Params:`, params);
    }
    
    if (logHeaders) {
      console.log(`[${requestId}] Headers:`, Object.fromEntries(event.request.headers));
    }
    
    if (logCookies && event.cookies) {
      console.log(`[${requestId}] Cookies:`, Object.fromEntries(
        Array.from(event.cookies.getAll()).map(cookie => [cookie.name, cookie.value])
      ));
    }
    
    if (logBody && event.request.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await event.request.clone().json();
        console.log(`[${requestId}] Body:`, body);
      } catch (e) {
        console.log(`[${requestId}] Could not parse body as JSON`);
      }
    }
    
    try {
      const response = await resolve(event);
      const duration = performance.now() - start;
      
      console.log(`[${requestId}] Response: ${response.status} (${duration.toFixed(2)}ms)`);
      
      return response;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`[${requestId}] Error after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };
}
