import { createTRPCRouter } from "./create-context";
import { authRouter } from "./routes/auth";
import { scansRouter } from "./routes/scans";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  scans: scansRouter,
});

export type AppRouter = typeof appRouter;
