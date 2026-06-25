import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  numeric,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin", "officer"]);
export const categoryEnum = pgEnum("category", [
  "documents", "electronics", "clothing", "food", "fragile", "other",
]);
export const parcelStatusEnum = pgEnum("parcel_status", [
  "registered", "received", "dispatched", "in_transit", "arrived",
  "ready_for_collection", "collected", "delayed", "returned",
]);
export const channelEnum = pgEnum("channel", ["sms", "whatsapp"]);
export const messageTypeEnum = pgEnum("message_type", [
  "registered", "arrived", "ready_for_collection",
  "collected", "delayed", "feedback_request",
]);
export const notificationStatusEnum = pgEnum("notification_status", ["pending", "sent", "failed"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  avatar: text("avatar"),
  role: roleEnum("role").default("officer").notNull(),
  stationId: bigint("stationId", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const stations = pgTable("stations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  district: varchar("district", { length: 255 }).notNull(),
  town: varchar("town", { length: 255 }).notNull(),
  landmark: varchar("landmark", { length: 500 }),
  physicalAddress: varchar("physicalAddress", { length: 500 }),
  phone: varchar("phone", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  operatingHours: varchar("operatingHours", { length: 255 }),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Station = typeof stations.$inferSelect;
export type InsertStation = typeof stations.$inferInsert;

export const parcels = pgTable("parcels", {
  id: serial("id").primaryKey(),
  trackingNumber: varchar("trackingNumber", { length: 50 }).notNull().unique(),
  collectionPin: varchar("collectionPin", { length: 10 }).notNull(),
  qrCodeData: text("qrCodeData"),

  senderName: varchar("senderName", { length: 255 }).notNull(),
  senderPhone: varchar("senderPhone", { length: 20 }).notNull(),

  receiverName: varchar("receiverName", { length: 255 }).notNull(),
  receiverPhone: varchar("receiverPhone", { length: 20 }).notNull(),
  receiverLandmark: varchar("receiverLandmark", { length: 500 }),

  description: text("description"),
  category: categoryEnum("category").notNull(),

  weightKg: numeric("weightKg", { precision: 6, scale: 2 }),
  declaredValueMwk: numeric("declaredValueMwk", { precision: 12, scale: 2 }),

  originStationId: bigint("originStationId", { mode: "number" }).notNull(),
  destinationStationId: bigint("destinationStationId", { mode: "number" }).notNull(),
  currentStationId: bigint("currentStationId", { mode: "number" }),

  status: parcelStatusEnum("status").notNull().default("registered"),

  registeredBy: bigint("registeredBy", { mode: "number" }).notNull(),
  estimatedArrival: timestamp("estimatedArrival"),
  collectedAt: timestamp("collectedAt"),
  collectedBy: varchar("collectedBy", { length: 255 }),

  rating: integer("rating"),
  feedback: text("feedback"),
  feedbackBranch: bigint("feedbackBranch", { mode: "number" }),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Parcel = typeof parcels.$inferSelect;
export type InsertParcel = typeof parcels.$inferInsert;

export const parcelEvents = pgTable("parcel_events", {
  id: serial("id").primaryKey(),
  parcelId: bigint("parcelId", { mode: "number" }).notNull(),
  status: parcelStatusEnum("status").notNull(),
  stationId: bigint("stationId", { mode: "number" }).notNull(),
  fromStationId: bigint("fromStationId", { mode: "number" }),
  toStationId: bigint("toStationId", { mode: "number" }),
  officerId: bigint("officerId", { mode: "number" }).notNull(),
  officerName: varchar("officerName", { length: 255 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ParcelEvent = typeof parcelEvents.$inferSelect;
export type InsertParcelEvent = typeof parcelEvents.$inferInsert;

export const notificationLogs = pgTable("notification_logs", {
  id: serial("id").primaryKey(),
  parcelId: bigint("parcelId", { mode: "number" }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  channel: channelEnum("channel").notNull().default("sms"),
  messageType: messageTypeEnum("messageType").notNull(),
  message: text("message").notNull(),
  atMessageId: varchar("atMessageId", { length: 255 }),
  atStatus: varchar("atStatus", { length: 50 }),
  atCost: varchar("atCost", { length: 50 }),
  status: notificationStatusEnum("status").notNull().default("pending"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = typeof notificationLogs.$inferInsert;
