import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { initializeDatabase } from "./init-db";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

console.log('[Backend] Starting server...');
console.log('[Backend] Environment check:', {
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  hasJwtSecret: !!process.env.JWT_SECRET,
  hasFacePP: !!process.env.FACEPP_API_KEY,
});

initializeDatabase().catch((error) => {
  console.error('[App] Failed to initialize database:', error);
  console.error('[App] Database error details:', error.message);
});

app.use("*", cors({
  origin: '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use("*", async (c, next) => {
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url}`);
  await next();
  console.log(`[${new Date().toISOString()}] Response status: ${c.res.status}`);
});

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error(`[tRPC Error] ${path}:`, error);
    },
  }),
);

app.get("/api", (c) => {
  return c.json({ 
    status: "ok", 
    message: "skinMaxx API is running",
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
    },
  });
});

app.get("/api/health", (c) => {
  return c.json({ 
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

export default app;
