import { db } from "@xat/db";
import { accounts, users, accountUsers } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * SAML SSO Service.
 *
 * Handles SAML 2.0 authentication flow:
 * 1. Generate SAML AuthnRequest (redirect to IdP)
 * 2. Process SAML Response (assertion consumer service)
 * 3. Map SAML attributes to user + account
 *
 * Supported IdPs: Okta, Azure AD, Google Workspace, OneLogin, Generic SAML 2.0
 */

export interface SamlConfig {
  entityId: string;
  ssoUrl: string;
  certificate: string;
  sloUrl?: string;
  nameIdFormat?: string;
  attributeMapping?: {
    email?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
}

export async function getSamlConfig(
  accountId: number,
): Promise<SamlConfig | null> {
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);

  if (!account) return null;

  const settings = (account.settings ?? {}) as Record<string, unknown>;
  const saml = settings.saml as SamlConfig | undefined;

  return saml ?? null;
}

export async function saveSamlConfig(
  accountId: number,
  config: SamlConfig,
) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);

  if (!account) return null;

  const settings = (account.settings ?? {}) as Record<string, unknown>;
  settings.saml = config;

  const [updated] = await db
    .update(accounts)
    .set({ settings, updatedAt: new Date() })
    .where(eq(accounts.id, accountId))
    .returning();

  return updated;
}

export async function deleteSamlConfig(accountId: number) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);

  if (!account) return;

  const settings = (account.settings ?? {}) as Record<string, unknown>;
  delete settings.saml;

  await db
    .update(accounts)
    .set({ settings, updatedAt: new Date() })
    .where(eq(accounts.id, accountId));
}

/**
 * Generates a SAML AuthnRequest URL for the given account.
 * The user should be redirected to this URL to start the SSO flow.
 */
export function generateAuthnRequestUrl(
  config: SamlConfig,
  callbackUrl: string,
): string {
  const id = `_${crypto.randomUUID()}`;
  const issueInstant = new Date().toISOString();

  const request = `
    <samlp:AuthnRequest
      xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
      xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
      ID="${id}"
      Version="2.0"
      IssueInstant="${issueInstant}"
      Destination="${config.ssoUrl}"
      AssertionConsumerServiceURL="${callbackUrl}"
      ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
      <saml:Issuer>${config.entityId}</saml:Issuer>
      <samlp:NameIDPolicy
        Format="${config.nameIdFormat ?? "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"}"
        AllowCreate="true"/>
    </samlp:AuthnRequest>
  `.trim();

  const encoded = Buffer.from(request).toString("base64");

  return `${config.ssoUrl}?SAMLRequest=${encodeURIComponent(encoded)}`;
}

/**
 * Processes a SAML Response and creates/finds the user.
 * Returns user info extracted from SAML assertion.
 */
export async function processSamlResponse(
  accountId: number,
  samlResponse: string,
): Promise<{ email: string; name: string; userId: number } | null> {
  const config = await getSamlConfig(accountId);
  if (!config) return null;

  // Decode the SAML response
  const decoded = Buffer.from(samlResponse, "base64").toString("utf8");

  // Extract NameID (email) from assertion
  const nameIdMatch = /<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/i.exec(decoded);
  if (!nameIdMatch?.[1]) return null;

  const email = nameIdMatch[1].trim().toLowerCase();

  // Extract name attributes
  const mapping = config.attributeMapping ?? {};
  let name = email.split("@")[0] ?? "";

  // Try to extract name from attributes
  const nameAttr = mapping.name ?? "displayName";
  const nameMatch = new RegExp(
    `Name="${nameAttr}"[^>]*>\\s*<saml:AttributeValue[^>]*>([^<]+)`,
    "i",
  ).exec(decoded);
  if (nameMatch?.[1]) {
    name = nameMatch[1].trim();
  }

  // Find or create user
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId: number;

  if (existingUser) {
    userId = existingUser.id;

    // Ensure user is member of this account
    const [membership] = await db
      .select()
      .from(accountUsers)
      .where(
        and(
          eq(accountUsers.userId, existingUser.id),
          eq(accountUsers.accountId, accountId),
        ),
      )
      .limit(1);

    if (!membership) {
      await db.insert(accountUsers).values({
        accountId,
        userId: existingUser.id,
        role: "agent",
      });
    }
  } else {
    // Create new user via SSO (no password needed)
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordDigest: "", // SSO users don't have passwords
        confirmedAt: new Date(),
      })
      .returning();

    userId = newUser!.id;

    await db.insert(accountUsers).values({
      accountId,
      userId,
      role: "agent",
    });
  }

  return { email, name, userId };
}
