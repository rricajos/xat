import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "@xat/db";
import { contacts } from "@xat/db/schema";
import { eq, and, isNotNull, sql } from "drizzle-orm";

/**
 * Find potential duplicate contacts based on shared email or phone number.
 * Groups contacts that share the same email or phone, suggesting them as merge candidates.
 */
export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.account) return json({ error: "Unauthorized" }, { status: 401 });

  const accountId = locals.account.id;

  // Find contacts sharing the same email
  const emailDuplicates = await db.execute(sql`
    SELECT email, array_agg(id ORDER BY created_at) as contact_ids, count(*) as cnt
    FROM contacts
    WHERE account_id = ${accountId} AND email IS NOT NULL AND email != ''
    GROUP BY email
    HAVING count(*) > 1
    LIMIT 50
  `);

  // Find contacts sharing the same phone number
  const phoneDuplicates = await db.execute(sql`
    SELECT phone_number, array_agg(id ORDER BY created_at) as contact_ids, count(*) as cnt
    FROM contacts
    WHERE account_id = ${accountId} AND phone_number IS NOT NULL AND phone_number != ''
    GROUP BY phone_number
    HAVING count(*) > 1
    LIMIT 50
  `);

  // Collect unique contact IDs from both queries
  const contactIds = new Set<number>();
  const duplicateGroups: Array<{
    field: string;
    value: string;
    contactIds: number[];
  }> = [];

  for (const row of emailDuplicates.rows as Array<Record<string, unknown>>) {
    const ids = row.contact_ids as number[];
    duplicateGroups.push({ field: "email", value: row.email as string, contactIds: ids });
    ids.forEach((id) => contactIds.add(id));
  }

  for (const row of phoneDuplicates.rows as Array<Record<string, unknown>>) {
    const ids = row.contact_ids as number[];
    duplicateGroups.push({ field: "phone_number", value: row.phone_number as string, contactIds: ids });
    ids.forEach((id) => contactIds.add(id));
  }

  // Fetch the actual contact records
  let contactRecords: Array<Record<string, unknown>> = [];
  if (contactIds.size > 0) {
    contactRecords = await db
      .select({
        id: contacts.id,
        name: contacts.name,
        email: contacts.email,
        phoneNumber: contacts.phoneNumber,
        createdAt: contacts.createdAt,
        lastActivityAt: contacts.lastActivityAt,
      })
      .from(contacts)
      .where(
        and(
          eq(contacts.accountId, accountId),
          sql`${contacts.id} = ANY(${sql.raw(`ARRAY[${[...contactIds].join(",")}]`)})`,
        ),
      );
  }

  return json({
    data: {
      groups: duplicateGroups,
      contacts: contactRecords,
      totalDuplicates: duplicateGroups.length,
    },
  });
};
