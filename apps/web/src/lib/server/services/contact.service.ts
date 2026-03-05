import { db } from "@xat/db";
import { contacts, companies } from "@xat/db/schema";
import { eq, and, desc, count, ilike, or } from "drizzle-orm";

export async function listContacts(
  accountId: number,
  options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {},
) {
  const { page = 1, limit = 25 } = options;
  const offset = (page - 1) * limit;

  const conditions = [eq(contacts.accountId, accountId)];

  if (options.search) {
    const search = `%${options.search}%`;
    conditions.push(
      or(
        ilike(contacts.name, search),
        ilike(contacts.email, search),
        ilike(contacts.phoneNumber, search),
      )!,
    );
  }

  const where = and(...conditions);

  const [totalResult] = await db
    .select({ count: count() })
    .from(contacts)
    .where(where);

  const rows = await db
    .select()
    .from(contacts)
    .where(where)
    .orderBy(desc(contacts.lastActivityAt))
    .limit(limit)
    .offset(offset);

  return { data: rows, total: totalResult?.count ?? 0 };
}

export async function getContact(accountId: number, contactId: number) {
  const [contact] = await db
    .select()
    .from(contacts)
    .where(
      and(eq(contacts.id, contactId), eq(contacts.accountId, accountId)),
    )
    .limit(1);

  return contact ?? null;
}

export async function createContact(params: {
  accountId: number;
  name?: string;
  email?: string;
  phoneNumber?: string;
  identifier?: string;
  avatarUrl?: string;
  companyId?: number;
}) {
  const [contact] = await db
    .insert(contacts)
    .values({
      accountId: params.accountId,
      name: params.name,
      email: params.email,
      phoneNumber: params.phoneNumber,
      identifier: params.identifier,
      avatarUrl: params.avatarUrl,
      companyId: params.companyId,
    })
    .returning();

  return contact;
}

export async function updateContact(
  accountId: number,
  contactId: number,
  data: {
    name?: string;
    email?: string;
    phoneNumber?: string;
    avatarUrl?: string;
    companyId?: number;
    customAttributes?: Record<string, unknown>;
  },
) {
  const [updated] = await db
    .update(contacts)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(contacts.id, contactId), eq(contacts.accountId, accountId)),
    )
    .returning();

  return updated;
}

export async function deleteContact(accountId: number, contactId: number) {
  await db
    .delete(contacts)
    .where(
      and(eq(contacts.id, contactId), eq(contacts.accountId, accountId)),
    );
}

export async function findOrCreateContact(params: {
  accountId: number;
  email?: string;
  phoneNumber?: string;
  identifier?: string;
  name?: string;
}) {
  // Try to find by identifier first, then email, then phone
  if (params.identifier) {
    const [existing] = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.accountId, params.accountId),
          eq(contacts.identifier, params.identifier),
        ),
      )
      .limit(1);
    if (existing) return existing;
  }

  if (params.email) {
    const [existing] = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.accountId, params.accountId),
          eq(contacts.email, params.email),
        ),
      )
      .limit(1);
    if (existing) return existing;
  }

  return createContact(params);
}
