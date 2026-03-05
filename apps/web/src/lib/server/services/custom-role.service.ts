import { db } from "@xat/db";
import { customRoles } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";

export const PERMISSIONS = [
  "conversations.manage",
  "conversations.assign",
  "conversations.resolve",
  "contacts.manage",
  "contacts.delete",
  "contacts.import_export",
  "labels.manage",
  "teams.manage",
  "inboxes.manage",
  "canned_responses.manage",
  "automation.manage",
  "macros.manage",
  "campaigns.manage",
  "reports.view",
  "help_center.manage",
  "agents.manage",
  "settings.manage",
  "audit_log.view",
  "custom_roles.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export async function listCustomRoles(accountId: number) {
  return db
    .select()
    .from(customRoles)
    .where(eq(customRoles.accountId, accountId))
    .orderBy(customRoles.name);
}

export async function createCustomRole(params: {
  accountId: number;
  name: string;
  permissions: string[];
}) {
  const [role] = await db
    .insert(customRoles)
    .values({
      accountId: params.accountId,
      name: params.name,
      permissions: params.permissions,
    })
    .returning();
  return role;
}

export async function updateCustomRole(
  accountId: number,
  roleId: number,
  data: { name?: string; permissions?: string[] },
) {
  const [updated] = await db
    .update(customRoles)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(customRoles.id, roleId), eq(customRoles.accountId, accountId)),
    )
    .returning();
  return updated;
}

export async function deleteCustomRole(accountId: number, roleId: number) {
  await db
    .delete(customRoles)
    .where(
      and(eq(customRoles.id, roleId), eq(customRoles.accountId, accountId)),
    );
}
