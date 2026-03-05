import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import { db } from "@xat/db";
import { accounts } from "@xat/db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_BUSINESS_HOURS = {
  timezone: "UTC",
  days: [
    { day: "monday", enabled: true, openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 0 },
    { day: "tuesday", enabled: true, openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 0 },
    { day: "wednesday", enabled: true, openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 0 },
    { day: "thursday", enabled: true, openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 0 },
    { day: "friday", enabled: true, openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 0 },
    { day: "saturday", enabled: false, openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 0 },
    { day: "sunday", enabled: false, openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 0 },
  ],
};

export const load: PageServerLoad = async ({ locals }) => {
  const [account] = await db
    .select({ settings: accounts.settings })
    .from(accounts)
    .where(eq(accounts.id, locals.account!.id))
    .limit(1);

  const settings = (account?.settings ?? {}) as Record<string, unknown>;
  const businessHours = settings.businessHours ?? DEFAULT_BUSINESS_HOURS;

  return { businessHours };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const timezone = formData.get("timezone") as string;

    const days = [
      "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
    ].map((day) => ({
      day,
      enabled: formData.get(`${day}_enabled`) === "on",
      openHour: parseInt(formData.get(`${day}_open_hour`) as string) || 9,
      openMinute: parseInt(formData.get(`${day}_open_minute`) as string) || 0,
      closeHour: parseInt(formData.get(`${day}_close_hour`) as string) || 17,
      closeMinute: parseInt(formData.get(`${day}_close_minute`) as string) || 0,
    }));

    // Get current settings
    const [account] = await db
      .select({ settings: accounts.settings })
      .from(accounts)
      .where(eq(accounts.id, locals.account!.id))
      .limit(1);

    const currentSettings = (account?.settings ?? {}) as Record<string, unknown>;

    await db
      .update(accounts)
      .set({
        settings: { ...currentSettings, businessHours: { timezone, days } },
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, locals.account!.id));

    return { success: true };
  },
};
