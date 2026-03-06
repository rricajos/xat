import { error } from "@sveltejs/kit";
import { generateIcalFeed, generateIcalFeedToken } from "$lib/server/services/calendar.service.js";
import { db } from "@xat/db";
import { users } from "@xat/db/schema";
import { eq } from "drizzle-orm";

// Public endpoint — verified by HMAC token
export async function GET(event) {
  const url = new URL(event.request.url);
  const token = url.searchParams.get("token");
  const userId = Number(url.searchParams.get("userId"));

  if (!token || !userId) error(400, { message: "token and userId required" });

  const expectedToken = generateIcalFeedToken(userId);
  if (token !== expectedToken) error(401, { message: "Invalid token" });

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) error(404, { message: "User not found" });

  const ical = await generateIcalFeed(userId);

  return new Response(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="xat-calendar.ics"`,
    },
  });
}
