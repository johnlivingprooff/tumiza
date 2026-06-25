/**
 * Tumiza Notification Service
 * Handles SMS and WhatsApp delivery via Africa's Talking.
 *
 * Africa's Talking is the primary notification provider for Malawi:
 * - SMS works on all Airtel Malawi and TNM networks
 * - WhatsApp Business API available for urban users with smartphones
 *
 * Integration docs: https://developers.africastalking.com
 */

import { getDb } from "../queries/connection";
import { notificationLogs } from "@db/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationChannel = "sms" | "whatsapp";

export type NotificationMessageType =
  | "registered"
  | "arrived"
  | "ready_for_collection"
  | "collected"
  | "delayed"
  | "feedback_request";

interface SendNotificationParams {
  parcelId: number;
  phoneNumber: string;
  channel: NotificationChannel;
  messageType: NotificationMessageType;
  message: string;
}

interface ATSmsRecipient {
  number: string;
  cost: string;
  status: string;
  statusCode: number;
  messageId: string;
}

interface ATSmsResponse {
  SMSMessageData: {
    Message: string;
    Recipients: ATSmsRecipient[];
  };
}

// ─── Message Templates ────────────────────────────────────────────────────────
// Kept concise for SMS (160-char limit on standard GSM encoding).
// Chichewa versions can be added as a future localisation layer.

export function buildMessage(
  type: NotificationMessageType,
  trackingNumber: string,
  extras: { stationName?: string; pin?: string; landmark?: string } = {}
): string {
  const trackUrl = `tumiza.mw/track/${trackingNumber}`;

  switch (type) {
    case "registered":
      return `TUMIZA: Your parcel (${trackingNumber}) has been registered and is on its way. Track it at ${trackUrl}`;

    case "arrived":
      return extras.landmark
        ? `TUMIZA: Your parcel (${trackingNumber}) has arrived at ${extras.stationName}. Location: ${extras.landmark}. It will be ready for collection soon.`
        : `TUMIZA: Your parcel (${trackingNumber}) has arrived at ${extras.stationName ?? "the station"}.`;

    case "ready_for_collection":
      return `TUMIZA: Your parcel (${trackingNumber}) is ready for collection at ${extras.stationName ?? "the station"}${extras.landmark ? ` (${extras.landmark})` : ""}. Show PIN ${extras.pin} to collect.`;

    case "collected":
      return `TUMIZA: Your parcel (${trackingNumber}) has been collected. Thank you for using Tumiza!`;

    case "delayed":
      return `TUMIZA: Your parcel (${trackingNumber}) has been delayed. We apologise for the inconvenience. Track at ${trackUrl}`;

    case "feedback_request":
      return `TUMIZA: Your parcel (${trackingNumber}) was delivered. Please rate your experience at ${trackUrl} — it helps us improve our service.`;

    default:
      return `TUMIZA: Update on your parcel ${trackingNumber}. Track at ${trackUrl}`;
  }
}

// ─── Africa's Talking Client ──────────────────────────────────────────────────

function getATCredentials() {
  const apiKey = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME ?? "sandbox"; // "sandbox" for dev
  const senderId = process.env.AT_SENDER_ID ?? "TUMIZA"; // Short code / sender name

  if (!apiKey) {
    console.warn("[notifications] AT_API_KEY not set — running in dry-run mode.");
    return null;
  }

  return { apiKey, username, senderId };
}

async function sendViaSMS(
  phoneNumber: string,
  message: string,
  credentials: { apiKey: string; username: string; senderId: string }
): Promise<{ messageId: string; status: string; cost: string } | null> {
  // Africa's Talking SMS endpoint
  const response = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: {
      apiKey: credentials.apiKey,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      username: credentials.username,
      to: phoneNumber,
      message,
      from: credentials.senderId,
    }).toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AT SMS failed (${response.status}): ${text}`);
  }

  const data: ATSmsResponse = await response.json();
  const recipient = data.SMSMessageData?.Recipients?.[0];

  if (!recipient) throw new Error("AT returned no recipient data");

  return {
    messageId: recipient.messageId,
    status: recipient.status,
    cost: recipient.cost,
  };
}

async function sendViaWhatsApp(
  phoneNumber: string,
  message: string,
  credentials: { apiKey: string; username: string }
): Promise<{ messageId: string; status: string; cost: string } | null> {
  // Africa's Talking WhatsApp Business API
  const response = await fetch("https://content.africastalking.com/version1/messaging/whatsapp", {
    method: "POST",
    headers: {
      apiKey: credentials.apiKey,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: credentials.username,
      productId: process.env.AT_WHATSAPP_PRODUCT_ID,
      channelNumber: process.env.AT_WHATSAPP_CHANNEL,
      to: phoneNumber,
      body: { type: "text", text: message },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AT WhatsApp failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return {
    messageId: data.messageId ?? "unknown",
    status: data.status ?? "sent",
    cost: data.cost ?? "N/A",
  };
}

// ─── Main Send Function ───────────────────────────────────────────────────────

export async function sendNotification(params: SendNotificationParams): Promise<void> {
  const db = getDb();
  const credentials = getATCredentials();

  // Always insert a log row first (pending), then update it
  const insertResult = await db.insert(notificationLogs).values({
    parcelId: params.parcelId,
    phoneNumber: params.phoneNumber,
    channel: params.channel,
    messageType: params.messageType,
    message: params.message,
    status: "pending",
  });

  const logId = Number(insertResult[0].insertId);

  // Dry-run mode when AT credentials are missing (dev/test)
  if (!credentials) {
    console.log(
      `[notifications] DRY RUN — ${params.channel.toUpperCase()} to ${params.phoneNumber}:\n${params.message}`
    );
    await db
      .update(notificationLogs)
      .set({ status: "sent", atStatus: "dry-run", atMessageId: "dry-run" })
      .where(/* id */ (t) => t.id === logId as never);
    return;
  }

  try {
    let result: { messageId: string; status: string; cost: string } | null = null;

    if (params.channel === "whatsapp") {
      result = await sendViaWhatsApp(params.phoneNumber, params.message, credentials);
    } else {
      result = await sendViaSMS(params.phoneNumber, params.message, credentials);
    }

    await db
      .update(notificationLogs)
      .set({
        status: "sent",
        atMessageId: result?.messageId,
        atStatus: result?.status,
        atCost: result?.cost,
      })
      .where((t) => t.id === logId as never);

    console.log(
      `[notifications] ✓ ${params.channel.toUpperCase()} sent to ${params.phoneNumber} — ${result?.cost}`
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[notifications] ✗ Failed to send ${params.channel} to ${params.phoneNumber}:`, errorMessage);

    await db
      .update(notificationLogs)
      .set({ status: "failed", errorMessage })
      .where((t) => t.id === logId as never);
    // Don't rethrow — notification failure should not break the parcel operation
  }
}

// ─── Convenience: Send to Both SMS + WhatsApp ─────────────────────────────────
// For important events (ready_for_collection, collected) send both channels.
// User gets whichever arrives first; WhatsApp carries richer formatting.

export async function sendDualNotification(
  parcelId: number,
  phoneNumber: string,
  messageType: NotificationMessageType,
  message: string
): Promise<void> {
  await Promise.allSettled([
    sendNotification({ parcelId, phoneNumber, channel: "sms", messageType, message }),
    sendNotification({ parcelId, phoneNumber, channel: "whatsapp", messageType, message }),
  ]);
}
