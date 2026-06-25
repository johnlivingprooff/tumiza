import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { parcels, parcelEvents, stations, notificationLogs } from "@db/schema";
import { eq, like, or, and, desc } from "drizzle-orm";
import {
  sendNotification,
  sendDualNotification,
  buildMessage,
} from "./lib/notifications";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateTrackingNumber(): string {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `TMZ-${random}`;
}

function generateCollectionPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const parcelRouter = createRouter({

  // ── Register ────────────────────────────────────────────────────────────────
  register: authedQuery
    .input(
      z.object({
        senderName: z.string().min(1, "Sender name required"),
        senderPhone: z.string().min(1, "Sender phone required"),
        receiverName: z.string().min(1, "Receiver name required"),
        receiverPhone: z.string().min(1, "Receiver phone required"),
        // Landmark addressing for last-mile delivery in Malawi
        receiverLandmark: z.string().optional(),
        description: z.string().optional(),
        category: z.enum(["documents", "electronics", "clothing", "food", "fragile", "other"]),
        weightKg: z.number().min(0).optional(),
        declaredValueMwk: z.number().min(0).optional(),
        originStationId: z.number(),
        destinationStationId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Retry tracking number generation to handle rare collisions
      let trackingNumber = generateTrackingNumber();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await db
          .select()
          .from(parcels)
          .where(eq(parcels.trackingNumber, trackingNumber))
          .limit(1);
        if (existing.length === 0) break;
        trackingNumber = generateTrackingNumber();
        attempts++;
      }

      const collectionPin = generateCollectionPin();
      const qrCodeData = trackingNumber; // QR encodes the tracking number

      const [parcel] = await db.insert(parcels).values({
        trackingNumber,
        collectionPin,
        qrCodeData,
        senderName: input.senderName,
        senderPhone: input.senderPhone,
        receiverName: input.receiverName,
        receiverPhone: input.receiverPhone,
        receiverLandmark: input.receiverLandmark,
        description: input.description,
        category: input.category,
        weightKg: input.weightKg?.toFixed(2),
        declaredValueMwk: input.declaredValueMwk?.toFixed(2),
        originStationId: input.originStationId,
        destinationStationId: input.destinationStationId,
        currentStationId: input.originStationId,
        status: "registered",
        registeredBy: ctx.user.id,
      }).returning();

      const parcelId = parcel.id;

      // Initial event
      await db.insert(parcelEvents).values({
        parcelId,
        status: "registered",
        stationId: input.originStationId,
        officerId: ctx.user.id,
        officerName: ctx.user.name ?? "Officer",
        notes: "Parcel registered",
      });

      // Notify sender via SMS
      const smsMessage = buildMessage("registered", trackingNumber);
      await sendNotification({
        parcelId,
        phoneNumber: input.senderPhone,
        channel: "sms",
        messageType: "registered",
        message: smsMessage,
      });

      return parcel;
    }),

  // ── Public Track ─────────────────────────────────────────────────────────────
  // Returns an array for phone-based lookups (a customer may have multiple parcels)
  track: publicQuery
    .input(
      z.object({
        trackingNumber: z.string().optional(),
        phoneNumber: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      if (!input.trackingNumber && !input.phoneNumber) return null;

      let parcelList: (typeof parcels.$inferSelect)[] = [];

      if (input.trackingNumber) {
        parcelList = await db
          .select()
          .from(parcels)
          .where(eq(parcels.trackingNumber, input.trackingNumber))
          .limit(1);
      } else if (input.phoneNumber) {
        // Return up to 10 parcels for this phone number
        parcelList = await db
          .select()
          .from(parcels)
          .where(
            or(
              eq(parcels.senderPhone, input.phoneNumber),
              eq(parcels.receiverPhone, input.phoneNumber)
            )
          )
          .orderBy(desc(parcels.createdAt))
          .limit(10);
      }

      if (parcelList.length === 0) return null;

      // For tracking-number lookup return a single enriched object;
      // for phone lookup return an array of enriched objects.
      const enrich = async (parcel: typeof parcels.$inferSelect) => {
        const [events, originStation, destinationStation, currentStation] =
          await Promise.all([
            db
              .select()
              .from(parcelEvents)
              .where(eq(parcelEvents.parcelId, parcel.id))
              .orderBy(parcelEvents.createdAt),
            db.select().from(stations).where(eq(stations.id, parcel.originStationId)).limit(1),
            db.select().from(stations).where(eq(stations.id, parcel.destinationStationId)).limit(1),
            parcel.currentStationId
              ? db.select().from(stations).where(eq(stations.id, parcel.currentStationId)).limit(1)
              : Promise.resolve([]),
          ]);

        return {
          ...parcel,
          events,
          originStation: originStation[0] ?? null,
          destinationStation: destinationStation[0] ?? null,
          currentStation: (currentStation as typeof stations.$inferSelect[])[0] ?? null,
        };
      };

      if (input.trackingNumber) {
        return enrich(parcelList[0]);
      }

      // Phone-based: return array
      return Promise.all(parcelList.map(enrich));
    }),

  // ── Get By ID (authenticated) ────────────────────────────────────────────────
  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const parcel = await db
        .select()
        .from(parcels)
        .where(eq(parcels.id, input.id))
        .limit(1);

      if (!parcel[0]) return null;

      const [events, originStation, destinationStation, currentStation] =
        await Promise.all([
          db
            .select()
            .from(parcelEvents)
            .where(eq(parcelEvents.parcelId, input.id))
            .orderBy(parcelEvents.createdAt),
          db.select().from(stations).where(eq(stations.id, parcel[0].originStationId)).limit(1),
          db.select().from(stations).where(eq(stations.id, parcel[0].destinationStationId)).limit(1),
          parcel[0].currentStationId
            ? db.select().from(stations).where(eq(stations.id, parcel[0].currentStationId)).limit(1)
            : Promise.resolve([]),
        ]);

      return {
        ...parcel[0],
        events,
        originStation: originStation[0] ?? null,
        destinationStation: destinationStation[0] ?? null,
        currentStation: (currentStation as typeof stations.$inferSelect[])[0] ?? null,
      };
    }),

  // ── Update Status ─────────────────────────────────────────────────────────────
  updateStatus: authedQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum([
          "registered",
          "received",
          "dispatched",
          "in_transit",
          "arrived",
          "ready_for_collection",
          "collected",
          "delayed",
          "returned",
        ]),
        // Populated on dispatch/transit — records the route segment
        fromStationId: z.number().optional(),
        toStationId: z.number().optional(),
        stationId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      const parcel = await db
        .select()
        .from(parcels)
        .where(eq(parcels.id, input.id))
        .limit(1);

      if (!parcel[0]) throw new Error("Parcel not found");

      const updateData: Record<string, unknown> = { status: input.status };
      if (input.stationId) updateData.currentStationId = input.stationId;

      await db.update(parcels).set(updateData).where(eq(parcels.id, input.id));

      const eventStationId =
        input.stationId ?? parcel[0].currentStationId ?? parcel[0].originStationId;

      await db.insert(parcelEvents).values({
        parcelId: input.id,
        status: input.status,
        stationId: eventStationId,
        // Now properly populated on dispatch/transit events
        fromStationId: input.fromStationId,
        toStationId: input.toStationId,
        officerId: ctx.user.id,
        officerName: ctx.user.name ?? "Officer",
        notes: input.notes ?? `Status updated to ${input.status}`,
      });

      // ── Notifications ──────────────────────────────────────────────────────
      // Fetch station with landmark for richer SMS messages
      const stationRows = await db
        .select()
        .from(stations)
        .where(eq(stations.id, eventStationId))
        .limit(1);
      const station = stationRows[0];

      if (input.status === "arrived") {
        // Notify receiver that parcel has arrived — include landmark
        const msg = buildMessage("arrived", parcel[0].trackingNumber, {
          stationName: station?.name,
          landmark: station?.landmark ?? undefined,
        });
        await sendNotification({
          parcelId: input.id,
          phoneNumber: parcel[0].receiverPhone,
          channel: "sms",
          messageType: "arrived",
          message: msg,
        });
      }

      if (input.status === "ready_for_collection") {
        // High-importance: send both SMS and WhatsApp with PIN + landmark
        const msg = buildMessage("ready_for_collection", parcel[0].trackingNumber, {
          stationName: station?.name,
          landmark: station?.landmark ?? undefined,
          pin: parcel[0].collectionPin,
        });
        await sendDualNotification(
          input.id,
          parcel[0].receiverPhone,
          "ready_for_collection",
          msg
        );
      }

      if (input.status === "delayed") {
        const msg = buildMessage("delayed", parcel[0].trackingNumber);
        await sendNotification({
          parcelId: input.id,
          phoneNumber: parcel[0].receiverPhone,
          channel: "sms",
          messageType: "delayed",
          message: msg,
        });
      }

      const events = await db
        .select()
        .from(parcelEvents)
        .where(eq(parcelEvents.parcelId, input.id))
        .orderBy(parcelEvents.createdAt);

      return { success: true, events };
    }),

  // ── Verify Collection PIN ─────────────────────────────────────────────────────
  verifyCollection: authedQuery
    .input(
      z.object({
        parcelId: z.number(),
        pin: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      const parcel = await db
        .select()
        .from(parcels)
        .where(eq(parcels.id, input.parcelId))
        .limit(1);

      if (!parcel[0]) throw new Error("Parcel not found");
      if (parcel[0].collectionPin !== input.pin) throw new Error("Invalid collection PIN");
      if (parcel[0].status === "collected") throw new Error("Parcel already collected");

      await db
        .update(parcels)
        .set({
          status: "collected",
          collectedAt: new Date(),
          collectedBy: ctx.user.name ?? "Officer",
        })
        .where(eq(parcels.id, input.parcelId));

      const stationId =
        parcel[0].currentStationId ?? parcel[0].destinationStationId;

      await db.insert(parcelEvents).values({
        parcelId: input.parcelId,
        status: "collected",
        stationId,
        officerId: ctx.user.id,
        officerName: ctx.user.name ?? "Officer",
        notes: "Parcel collected — PIN verified",
      });

      // Confirm collection to receiver + request feedback via both channels
      const collectedMsg = buildMessage("collected", parcel[0].trackingNumber);
      const feedbackMsg = buildMessage("feedback_request", parcel[0].trackingNumber);

      await sendDualNotification(
        input.parcelId,
        parcel[0].receiverPhone,
        "collected",
        collectedMsg
      );

      // Feedback request via SMS only (less intrusive)
      await sendNotification({
        parcelId: input.parcelId,
        phoneNumber: parcel[0].receiverPhone,
        channel: "sms",
        messageType: "feedback_request",
        message: feedbackMsg,
      });

      return { success: true };
    }),

  // ── Search ───────────────────────────────────────────────────────────────────
  search: authedQuery
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const searchPattern = `%${input.query}%`;

      return db
        .select()
        .from(parcels)
        .where(
          or(
            like(parcels.trackingNumber, searchPattern),
            like(parcels.senderPhone, searchPattern),
            like(parcels.receiverPhone, searchPattern),
            like(parcels.senderName, searchPattern),
            like(parcels.receiverName, searchPattern)
          )
        )
        .orderBy(desc(parcels.createdAt))
        .limit(50);
    }),

  // ── List ─────────────────────────────────────────────────────────────────────
  list: authedQuery
    .input(
      z
        .object({
          status: z.string().optional(),
          stationId: z.number().optional(),
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];

      if (input?.status) {
        conditions.push(
          eq(
            parcels.status,
            input.status as
              | "registered"
              | "received"
              | "dispatched"
              | "in_transit"
              | "arrived"
              | "ready_for_collection"
              | "collected"
              | "delayed"
              | "returned"
          )
        );
      }
      if (input?.stationId) {
        conditions.push(eq(parcels.currentStationId, input.stationId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      return db
        .select()
        .from(parcels)
        .where(whereClause)
        .orderBy(desc(parcels.createdAt))
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0);
    }),

  // ── Submit Feedback ───────────────────────────────────────────────────────────
  submitFeedback: publicQuery
    .input(
      z.object({
        parcelId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Fetch currentStationId first to avoid a self-referencing subquery bug
      const parcel = await db
        .select({ currentStationId: parcels.currentStationId })
        .from(parcels)
        .where(eq(parcels.id, input.parcelId))
        .limit(1);

      if (!parcel[0]) throw new Error("Parcel not found");

      await db
        .update(parcels)
        .set({
          rating: input.rating,
          feedback: input.comment,
          feedbackBranch: parcel[0].currentStationId ?? undefined,
        })
        .where(eq(parcels.id, input.parcelId));

      return { success: true };
    }),

  // ── Notification Logs (admin) ─────────────────────────────────────────────────
  getNotificationLogs: authedQuery
    .input(z.object({ parcelId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(notificationLogs)
        .where(eq(notificationLogs.parcelId, input.parcelId))
        .orderBy(desc(notificationLogs.createdAt));
    }),
});
