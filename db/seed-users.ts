/**
 * Tumiza User Seeder
 *
 * Creates default accounts so you can log in immediately.
 * Run:  npx tsx db/seed-users.ts
 *
 * Passwords are read from environment variables so they are never
 * hard-coded. If the vars are absent a secure random password is
 * generated and printed ONCE — copy it immediately, it will not be
 * shown again.
 *
 *   SEED_ADMIN_PASSWORD=<pass>   SEED_OFFICER_PASSWORD=<pass>  npx tsx db/seed-users.ts
 *
 * ┌─────────────────────────────┬──────────────────────────┬─────────┐
 * │ Email                       │ Password source          │ Role    │
 * ├─────────────────────────────┼──────────────────────────┼─────────┤
 * │ admin@tumiza.mw             │ $SEED_ADMIN_PASSWORD     │ admin   │
 * │ officer@tumiza.mw           │ $SEED_OFFICER_PASSWORD   │ officer │
 * └─────────────────────────────┴──────────────────────────┴─────────┘
 */

import "dotenv/config";
import { getDb } from "../api/queries/connection";
import { users } from "./schema";
import { hashPassword } from "../api/lib/password";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

function resolvePassword(envVar: string, role: string): string {
  const fromEnv = process.env[envVar];
  if (fromEnv && fromEnv.length >= 12) return fromEnv;
  if (fromEnv) {
    console.warn(`  ⚠  ${envVar} is set but too short (min 12 chars) — using a generated password instead.`);
  }
  // Generate a secure random password and display it clearly
  const generated = nanoid(20);
  console.log(`\n  ┌─────────────────────────────────────────────────────┐`);
  console.log(`  │  Generated ${role} password — copy before it scrolls  │`);
  console.log(`  │  ${generated.padEnd(51)} │`);
  console.log(`  └─────────────────────────────────────────────────────┘\n`);
  return generated;
}

const defaultUsers = [
  {
    name: "Tumiza Admin",
    email: "admin@tumiza.mw",
    password: resolvePassword("SEED_ADMIN_PASSWORD", "admin"),
    role: "admin" as const,
    stationId: 1,
  },
  {
    name: "Station Officer",
    email: "officer@tumiza.mw",
    password: resolvePassword("SEED_OFFICER_PASSWORD", "officer"),
    role: "officer" as const,
    stationId: 1,
  },
];

async function seedUsers() {
  const db = getDb();
  console.log("Seeding default Tumiza users...\n");

  for (const u of defaultUsers) {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, u.email))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  ⚠  ${u.email} already exists — skipping`);
      continue;
    }

    const passwordHash = await hashPassword(u.password);
    const unionId = nanoid();

    await db.insert(users).values({
      unionId,
      name: u.name,
      email: u.email,
      passwordHash,
      role: u.role,
      stationId: u.stationId,
    });

    console.log(`  ✓  Created ${u.role}: ${u.email}`);
  }

  console.log("\nDone.");
}

seedUsers().catch(console.error);
