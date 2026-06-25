import { authRouter } from "./auth-router";
import { stationRouter } from "./station-router";
import { parcelRouter } from "./parcel-router";
import { dashboardRouter } from "./dashboard-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  station: stationRouter,
  parcel: parcelRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
