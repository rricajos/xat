import { db } from "@xat/db";
import { companies, contacts } from "@xat/db/schema";
import { eq, and, desc, count, ilike, or } from "drizzle-orm";

export async function listCompanies(accountId: number, options: { page?: number; limit?: number; search?: string } = {}) {
  const { page = 1, limit = 25 } = options;
  const offset = (page - 1) * limit;
  const conditions = [eq(companies.accountId, accountId)];
  if (options.search) {
    const search = `%${options.search}%`;
    conditions.push(or(ilike(companies.name, search), ilike(companies.domain, search))!);
  }
  const where = and(...conditions);
  const [totalResult] = await db.select({ count: count() }).from(companies).where(where);
  const rows = await db.select().from(companies).where(where).orderBy(desc(companies.createdAt)).limit(limit).offset(offset);
  return { data: rows, total: totalResult?.count ?? 0 };
}

export async function getCompany(accountId: number, companyId: number) {
  const [company] = await db.select().from(companies).where(and(eq(companies.id, companyId), eq(companies.accountId, accountId))).limit(1);
  return company ?? null;
}

export async function createCompany(params: { accountId: number; name: string; domain?: string; description?: string }) {
  const [company] = await db.insert(companies).values(params).returning();
  return company;
}

export async function updateCompany(accountId: number, companyId: number, data: { name?: string; domain?: string; description?: string; customAttributes?: Record<string, unknown> }) {
  const [updated] = await db.update(companies).set({ ...data, updatedAt: new Date() }).where(and(eq(companies.id, companyId), eq(companies.accountId, accountId))).returning();
  return updated;
}

export async function deleteCompany(accountId: number, companyId: number) {
  // Unlink contacts first
  await db.update(contacts).set({ companyId: null, updatedAt: new Date() }).where(and(eq(contacts.companyId, companyId), eq(contacts.accountId, accountId)));
  await db.delete(companies).where(and(eq(companies.id, companyId), eq(companies.accountId, accountId)));
}

export async function getCompanyContacts(accountId: number, companyId: number) {
  return db.select().from(contacts).where(and(eq(contacts.accountId, accountId), eq(contacts.companyId, companyId))).orderBy(desc(contacts.lastActivityAt));
}
