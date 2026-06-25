import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  int,
  bigint,
  decimal,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(), // kept for session JWT compat
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),  // PBKDF2-SHA256; format: pbkdf2$<iterations>$<salt_hex>$<hash_hex>
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin", "officer"]).default("officer").notNull(),
  stationId: bigint("stationId", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Stations ─────────────────────────────────────────────────────────────────
// Malawi-specific: landmark addressing is critical because formal street
// addresses are unreliable outside major city centres.

export const stations = mysqlTable("stations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  district: varchar("district", { length: 255 }).notNull(),
  town: varchar("town", { length: 255 }).notNull(),
  // Landmark-based addressing — how locals actually navigate
  landmark: varchar("landmark", { length: 500 }),          // e.g. "Next to Shoprite, Old Town"
  physicalAddress: varchar("physicalAddress", { length: 500 }), // formal address where it exists
  // Contact
  phone: varchar("phone", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  // Operating hours (plain text for flexibility — e.g. "Mon–Sat 07:30–17:00")
  operatingHours: varchar("operatingHours", { length: 255 }),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Station = typeof stations.$inferSelect;
export type InsertStation = typeof stations.$inferInsert;

// ─── Parcels ──────────────────────────────────────────────────────────────────

export const parcels = mysqlTable("parcels", {
  id: serial("id").primaryKey(),
  trackingNumber: varchar("trackingNumber", { length: 50 }).notNull().unique(),
  collectionPin: varchar("collectionPin", { length: 10 }).notNull(),
  qrCodeData: text("qrCodeData"),

  // Sender
  senderName: varchar("senderName", { length: 255 }).notNull(),
  senderPhone: varchar("senderPhone", { length: 20 }).notNull(),

  // Receiver
  receiverName: varchar("receiverName", { length: 255 }).notNull(),
  receiverPhone: varchar("receiverPhone", { length: 20 }).notNull(),
  // Landmark-based delivery address for the receiver — critical for last-mile
  // in Malawi where GPS addressing is unreliable
  receiverLandmark: varchar("receiverLandmark", { length: 500 }),

  // Parcel details
  description: text("description"),
  category: mysqlEnum("category", [
    "documents",
    "electronics",
    "clothing",
    "food",
    "fragile",
    "other",
  ]).notNull(),

  // Physical attributes — needed for courier pricing
  weightKg: decimal("weightKg", { precision: 6, scale: 2 }),      // e.g. 1.50 kg
  declaredValueMwk: decimal("declaredValueMwk", { precision: 12, scale: 2 }), // MWK value for insurance/disputes

  // Routing
  originStationId: bigint("originStationId", { mode: "number", unsigned: true }).notNull(),
  destinationStationId: bigint("destinationStationId", { mode: "number", unsigned: true }).notNull(),
  currentStationId: bigint("currentStationId", { mode: "number", unsigned: true }),

  // Status lifecycle
  status: mysqlEnum("status", [
    "registered",
    "received",
    "dispatched",
    "in_transit",
    "arrived",
    "ready_for_collection",
    "collected",
    "delayed",
    "returned",
  ])
    .notNull()
    .default("registered"),

  registeredBy: bigint("registeredBy", { mode: "number", unsigned: true }).notNull(),
  estimatedArrival: timestamp("estimatedArrival"),
  collectedAt: timestamp("collectedAt"),
  collectedBy: varchar("collectedBy", { length: 255 }),

  // Customer feedback
  rating: int("rating"),
  feedback: text("feedback"),
  feedbackBranch: bigint("feedbackBranch", { mode: "number", unsigned: true }),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Parcel = typeof parcels.$inferSelect;
export type InsertParcel = typeof parcels.$inferInsert;

// ─── Parcel Events ────────────────────────────────────────────────────────────

export const parcelEvents = mysqlTable("parcel_events", {
  id: serial("id").primaryKey(),
  parcelId: bigint("parcelId", { mode: "number", unsigned: true }).notNull(),
  status: mysqlEnum("status", [
    "registered",
    "received",
    "dispatched",
    "in_transit",
    "arrived",
    "ready_for_collection",
    "collected",
    "delayed",
    "returned",
  ]).notNull(),
  stationId: bigint("stationId", { mode: "number", unsigned: true }).notNull(),
  // Populated on dispatch/transit events to record route segment
  fromStationId: bigint("fromStationId", { mode: "number", unsigned: true }),
  toStationId: bigint("toStationId", { mode: "number", unsigned: true }),
  officerId: bigint("officerId", { mode: "number", unsigned: true }).notNull(),
  officerName: varchar("officerName", { length: 255 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ParcelEvent = typeof parcelEvents.$inferSelect;
export type InsertParcelEvent = typeof parcelEvents.$inferInsert;

// ─── SMS / WhatsApp Notification Logs ────────────────────────────────────────
// Africa's Talking handles both SMS and WhatsApp Business in Malawi.
// We log every outbound message with channel + AT message ID for reconciliation.

export const notificationLogs = mysqlTable("notification_logs", {
  id: serial("id").primaryKey(),
  parcelId: bigint("parcelId", { mode: "number", unsigned: true }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  channel: mysqlEnum("channel", ["sms", "whatsapp"]).notNull().default("sms"),
  messageType: mysqlEnum("messageType", [
    "registered",
    "arrived",
    "ready_for_collection",
    "collected",
    "delayed",
    "feedback_request",
  ]).notNull(),
  message: text("message").notNull(),
  // Africa's Talking response fields
  atMessageId: varchar("atMessageId", { length: 255 }),  // AT's messageId for delivery tracking
  atStatus: varchar("atStatus", { length: 50 }),         // e.g. "Success", "Failed"
  atCost: varchar("atCost", { length: 50 }),             // e.g. "MWK 3.0000"
  status: mysqlEnum("status", ["pending", "sent", "failed"]).notNull().default("pending"),
  errorMessage: text("errorMessage"),                    // populated on failure
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = typeof notificationLogs.$inferInsert;
