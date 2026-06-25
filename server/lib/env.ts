import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

const appSecret = required("APP_SECRET");
if (appSecret && appSecret.length < 32) {
  throw new Error(
    `APP_SECRET must be at least 32 characters long. ` +
    `Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
  );
}

export const env = {
  appSecret,
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
};
