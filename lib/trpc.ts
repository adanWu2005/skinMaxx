import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_API_BASE_URL;

  console.log('[tRPC] Base URL from env:', url);

  if (!url) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL environment variable is not set",
    );
  }

  return url.replace(/\/$/, '');
};

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export const setOnUnauthorized = (callback: () => void) => {
  onUnauthorized = callback;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      headers: () => {
        const headers: Record<string, string> = {};
        if (authToken) {
          headers.authorization = `Bearer ${authToken}`;
        }
        return headers;
      },
      fetch: async (url, options) => {
        console.log('[tRPC] Full request URL:', url);
        console.log('[tRPC] Request method:', options?.method);
        if (options?.body && typeof options.body === 'string') {
          console.log('[tRPC] Request body:', options.body.substring(0, 200));
        }
        
        try {
          const response = await fetch(url, options);
          console.log('[tRPC] Response status:', response.status);
          console.log('[tRPC] Response headers:', Object.fromEntries(response.headers.entries()));
          
          if (!response.ok) {
            const text = await response.clone().text();
            console.log('[tRPC] Error response:', text.substring(0, 500));
            
            if (response.status === 401) {
              console.error('[tRPC] 401 Unauthorized - triggering logout');
              if (onUnauthorized) {
                setTimeout(() => onUnauthorized?.(), 0);
              }
            }
          }
          
          return response;
        } catch (error) {
          console.error('[tRPC] Fetch failed for URL:', url);
          console.error('[tRPC] Fetch error details:', error);
          console.error('[tRPC] Error name:', (error as Error)?.name);
          console.error('[tRPC] Error message:', (error as Error)?.message);
          throw new Error(`Failed to connect to API. ${(error as Error)?.message || 'Network error'}`);
        }
      },
    }),
  ],
});
