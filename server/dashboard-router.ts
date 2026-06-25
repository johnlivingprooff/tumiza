import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { parcels, stations } from "@db/schema";
import { eq, sql, count, desc, gte } from "drizzle-orm";

export const dashboardRouter = createRouter({
  getStats: authedQuery.query(async () => {
    const db = getDb();

    const totalResult = await db.select({ count: count() }).from(parcels);
    const inTransitResult = await db
      .select({ count: count() })
      .from(parcels)
      .where(eq(parcels.status, "in_transit"));
    const arrivedResult = await db
      .select({ count: count() })
      .from(parcels)
      .where(eq(parcels.status, "arrived"));
    const collectedResult = await db
      .select({ count: count() })
      .from(parcels)
      .where(eq(parcels.status, "collected"));
    const delayedResult = await db
      .select({ count: count() })
      .from(parcels)
      .where(eq(parcels.status, "delayed"));
    const readyResult = await db
      .select({ count: count() })
      .from(parcels)
      .where(eq(parcels.status, "ready_for_collection"));

    return {
      totalParcels: totalResult[0]?.count ?? 0,
      inTransit: inTransitResult[0]?.count ?? 0,
      arrived: arrivedResult[0]?.count ?? 0,
      collected: collectedResult[0]?.count ?? 0,
      delayed: delayedResult[0]?.count ?? 0,
      readyForCollection: readyResult[0]?.count ?? 0,
    };
  }),

  getDailyVolume: authedQuery
    .input(z.object({ days: z.number().optional().default(30) }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const days = input?.days ?? 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const results = await db
        .select({
          date: sql<string>`DATE(createdAt)`,
          count: count(),
        })
        .from(parcels)
        .where(gte(parcels.createdAt, startDate))
        .groupBy(sql`DATE(createdAt)`)
        .orderBy(sql`DATE(createdAt)`);

      return results;
    }),

  getMonthlyVolume: authedQuery
    .input(z.object({ months: z.number().optional().default(12) }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const months = input?.months ?? 12;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const results = await db
        .select({
          month: sql<string>`DATE_FORMAT(createdAt, '%Y-%m')`,
          count: count(),
        })
        .from(parcels)
        .where(gte(parcels.createdAt, startDate))
        .groupBy(sql`DATE_FORMAT(createdAt, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(createdAt, '%Y-%m')`);

      return results;
    }),

  getActiveRoutes: authedQuery.query(async () => {
    const db = getDb();

    const results = await db
      .select({
        originId: parcels.originStationId,
        destinationId: parcels.destinationStationId,
        count: count(),
      })
      .from(parcels)
      .groupBy(parcels.originStationId, parcels.destinationStationId)
      .orderBy(desc(count()))
      .limit(10);

    const stationNames = new Map<number, string>();
    const allStations = await db.select().from(stations);
    for (const s of allStations) {
      stationNames.set(s.id, s.name);
    }

    return results.map((r) => ({
      origin: stationNames.get(r.originId) ?? "Unknown",
      destination: stationNames.get(r.destinationId) ?? "Unknown",
      count: r.count,
    }));
  }),

  getRatings: authedQuery.query(async () => {
    const db = getDb();

    const results = await db
      .select({
        branchId: parcels.feedbackBranch,
        avgRating: sql<number>`AVG(rating)`,
        count: count(),
      })
      .from(parcels)
      .where(sql`rating IS NOT NULL`)
      .groupBy(parcels.feedbackBranch);

    const stationNames = new Map<number, string>();
    const allStations = await db.select().from(stations);
    for (const s of allStations) {
      stationNames.set(s.id, s.name);
    }

    return results.map((r) => ({
      branch: stationNames.get(r.branchId ?? 0) ?? "Unknown",
      avgRating: Math.round((r.avgRating ?? 0) * 10) / 10,
      count: r.count,
    }));
  }),
});
