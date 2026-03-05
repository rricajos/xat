import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import { db } from "@xat/db";
import { customAttributeDefinitions } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals }) => {
  const attributes = await db
    .select()
    .from(customAttributeDefinitions)
    .where(eq(customAttributeDefinitions.accountId, locals.account!.id))
    .orderBy(customAttributeDefinitions.attributeDisplayName);

  return { attributes };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const displayName = formData.get("displayName") as string;
    const displayType = formData.get("displayType") as string;
    const key = formData.get("key") as string;
    const model = formData.get("model") as string;

    if (!displayName?.trim() || !key?.trim()) {
      return fail(400, { error: "Name and key are required" });
    }

    await db.insert(customAttributeDefinitions).values({
      accountId: locals.account!.id,
      attributeDisplayName: displayName.trim(),
      attributeDisplayType: displayType || "text",
      attributeKey: key.trim().toLowerCase().replace(/\s+/g, "_"),
      attributeModel: model || "conversation",
    });

    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const attrId = parseInt(formData.get("attrId") as string);

    await db
      .delete(customAttributeDefinitions)
      .where(
        and(
          eq(customAttributeDefinitions.id, attrId),
          eq(customAttributeDefinitions.accountId, locals.account!.id),
        ),
      );

    return { success: true };
  },
};
