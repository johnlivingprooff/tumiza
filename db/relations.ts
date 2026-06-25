import { relations } from "drizzle-orm";
import { users, stations, parcels, parcelEvents, notificationLogs } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  parcelsRegistered: many(parcels, { relationName: "registeredBy" }),
}));

export const stationsRelations = relations(stations, ({ many }) => ({
  parcelsOrigin: many(parcels, { relationName: "originStation" }),
  parcelsDestination: many(parcels, { relationName: "destinationStation" }),
  parcelsCurrent: many(parcels, { relationName: "currentStation" }),
  events: many(parcelEvents),
}));

export const parcelsRelations = relations(parcels, ({ one, many }) => ({
  originStation: one(stations, {
    fields: [parcels.originStationId],
    references: [stations.id],
    relationName: "originStation",
  }),
  destinationStation: one(stations, {
    fields: [parcels.destinationStationId],
    references: [stations.id],
    relationName: "destinationStation",
  }),
  currentStation: one(stations, {
    fields: [parcels.currentStationId],
    references: [stations.id],
    relationName: "currentStation",
  }),
  events: many(parcelEvents),
  notificationLogs: many(notificationLogs),
}));

export const parcelEventsRelations = relations(parcelEvents, ({ one }) => ({
  parcel: one(parcels, {
    fields: [parcelEvents.parcelId],
    references: [parcels.id],
  }),
  station: one(stations, {
    fields: [parcelEvents.stationId],
    references: [stations.id],
  }),
}));

export const notificationLogsRelations = relations(notificationLogs, ({ one }) => ({
  parcel: one(parcels, {
    fields: [notificationLogs.parcelId],
    references: [parcels.id],
  }),
}));
