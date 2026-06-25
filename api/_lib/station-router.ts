import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { stations } from "@db/schema";
import { eq } from "drizzle-orm";

export const stationRouter = createRouter({
  // Public list — used in parcel registration dropdown and tracking page
  list: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(stations)
      .where(eq(stations.isActive, true))
      .orderBy(stations.district);
  }),

  // Single station with full details (landmark, hours, contacts)
  getById: publicQuery
    .input((val: unknown) => {
      if (typeof val !== "object" || val === null || !("id" in val)) throw new Error("Invalid input");
      return val as { id: number };
    })
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(stations)
        .where(eq(stations.id, (input as { id: number }).id))
        .limit(1);
      return result[0] ?? null;
    }),
});
