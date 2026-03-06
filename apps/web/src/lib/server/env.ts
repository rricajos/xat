function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

export const env = {
  get DATABASE_URL() {
    return requireEnv("DATABASE_URL");
  },
  get REDIS_URL() {
    return optionalEnv("REDIS_URL", "redis://localhost:6379");
  },
  get PORT() {
    return parseInt(optionalEnv("PORT", "5173"));
  },
  get NODE_ENV() {
    return optionalEnv("NODE_ENV", "development");
  },
  get PUBLIC_APP_URL() {
    return optionalEnv("PUBLIC_APP_URL", "http://localhost:5173");
  },
  get S3_ENDPOINT() {
    return optionalEnv("S3_ENDPOINT", "http://localhost:9000");
  },
  get S3_ACCESS_KEY() {
    return optionalEnv("S3_ACCESS_KEY", "minioadmin");
  },
  get S3_SECRET_KEY() {
    return optionalEnv("S3_SECRET_KEY", "minioadmin");
  },
  get S3_BUCKET() {
    return optionalEnv("S3_BUCKET", "xat-uploads");
  },
  get S3_REGION() {
    return optionalEnv("S3_REGION", "us-east-1");
  },
  get SMTP_HOST() {
    return optionalEnv("SMTP_HOST", "");
  },
  get SMTP_PORT() {
    return parseInt(optionalEnv("SMTP_PORT", "587"));
  },
  get SMTP_USERNAME() {
    return optionalEnv("SMTP_USERNAME", "");
  },
  get SMTP_PASSWORD() {
    return optionalEnv("SMTP_PASSWORD", "");
  },
  get SMTP_FROM_EMAIL() {
    return optionalEnv("SMTP_FROM_EMAIL", "noreply@xat.app");
  },
  get OPENAI_API_KEY() {
    return optionalEnv("OPENAI_API_KEY", "");
  },
  get VAPID_PUBLIC_KEY() {
    return optionalEnv("VAPID_PUBLIC_KEY", "");
  },
  get VAPID_PRIVATE_KEY() {
    return optionalEnv("VAPID_PRIVATE_KEY", "");
  },
  get VAPID_SUBJECT() {
    return optionalEnv("VAPID_SUBJECT", "mailto:admin@xat.app");
  },
  get TWILIO_ACCOUNT_SID() {
    return optionalEnv("TWILIO_ACCOUNT_SID", "");
  },
  get TWILIO_AUTH_TOKEN() {
    return optionalEnv("TWILIO_AUTH_TOKEN", "");
  },
  get DYTE_API_KEY() {
    return optionalEnv("DYTE_API_KEY", "");
  },
  get DYTE_ORG_ID() {
    return optionalEnv("DYTE_ORG_ID", "");
  },
  // --- Calendar OAuth providers ---
  get GOOGLE_CLIENT_ID() {
    return optionalEnv("GOOGLE_CLIENT_ID", "");
  },
  get GOOGLE_CLIENT_SECRET() {
    return optionalEnv("GOOGLE_CLIENT_SECRET", "");
  },
  get MICROSOFT_CLIENT_ID() {
    return optionalEnv("MICROSOFT_CLIENT_ID", "");
  },
  get MICROSOFT_CLIENT_SECRET() {
    return optionalEnv("MICROSOFT_CLIENT_SECRET", "");
  },
  get ZOOM_CLIENT_ID() {
    return optionalEnv("ZOOM_CLIENT_ID", "");
  },
  get ZOOM_CLIENT_SECRET() {
    return optionalEnv("ZOOM_CLIENT_SECRET", "");
  },
  get isProduction() {
    return this.NODE_ENV === "production";
  },
  get isDevelopment() {
    return this.NODE_ENV === "development";
  },
};
