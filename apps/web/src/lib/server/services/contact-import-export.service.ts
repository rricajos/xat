import { db } from "@xat/db";
import { contacts } from "@xat/db/schema";
import { eq } from "drizzle-orm";

interface ContactCsvRow {
  name?: string;
  email?: string;
  phone_number?: string;
  company_id?: string;
  identifier?: string;
}

export async function importContactsCsv(
  accountId: number,
  csvContent: string,
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) {
    return { imported: 0, skipped: 0, errors: ["CSV file is empty or has no data rows"] };
  }

  const headers = lines[0]!.split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  const rows: ContactCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]!);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]!] = values[j]?.trim() ?? "";
    }
    rows.push(row as ContactCsvRow);
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;

    if (!row.name && !row.email) {
      skipped++;
      continue;
    }

    try {
      await db.insert(contacts).values({
        accountId,
        name: row.name || null,
        email: row.email || null,
        phoneNumber: row.phone_number || null,
        identifier: row.identifier || null,
      });
      imported++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("duplicate") || message.includes("unique")) {
        skipped++;
      } else {
        errors.push(`Row ${i + 2}: ${message}`);
      }
    }
  }

  return { imported, skipped, errors };
}

export async function exportContactsCsv(accountId: number): Promise<string> {
  const allContacts = await db
    .select({
      name: contacts.name,
      email: contacts.email,
      phoneNumber: contacts.phoneNumber,
      companyId: contacts.companyId,
      identifier: contacts.identifier,
    })
    .from(contacts)
    .where(eq(contacts.accountId, accountId));

  const headers = ["name", "email", "phone_number", "company_id", "identifier"];
  const csvLines = [headers.join(",")];

  for (const contact of allContacts) {
    const values = [
      escapeCsvField(contact.name ?? ""),
      escapeCsvField(contact.email ?? ""),
      escapeCsvField(contact.phoneNumber ?? ""),
      escapeCsvField(contact.companyId != null ? String(contact.companyId) : ""),
      escapeCsvField(contact.identifier ?? ""),
    ];
    csvLines.push(values.join(","));
  }

  return csvLines.join("\n");
}

function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}
