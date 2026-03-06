import { json } from "@sveltejs/kit";
import { requireAuth, errorResponse } from "$lib/server/api-auth";
import {
  generateTotpSecret,
  getTotpUri,
  verifyTotpCode,
  enable2FA,
  disable2FA,
  getUserTwoFactor,
} from "$lib/server/services/two-factor.service.js";
import type { RequestHandler } from "./$types";

// GET — fetch current 2FA status
export const GET: RequestHandler = async (event) => {
  const { user } = requireAuth(event);
  const twoFactor = await getUserTwoFactor(user.id);
  return json({ data: { enabled: twoFactor?.twoFactorEnabled ?? false } });
};

// POST — begin 2FA setup: returns secret + otpauth URI for QR code
export const POST: RequestHandler = async (event) => {
  const { user } = requireAuth(event);
  const current = await getUserTwoFactor(user.id);
  if (current?.twoFactorEnabled) return errorResponse("2FA already enabled", 409);

  const secret = generateTotpSecret();
  const uri = getTotpUri(secret, user.email);
  return json({ data: { secret, uri } });
};

// PATCH — confirm setup: verify code, then enable
export const PATCH: RequestHandler = async (event) => {
  const { user } = requireAuth(event);
  const body = await event.request.json();
  const { secret, code } = body;

  if (!secret || !code) return errorResponse("secret and code are required", 400);
  if (!verifyTotpCode(secret, String(code))) return errorResponse("Invalid code", 400);

  await enable2FA(user.id, secret);
  return json({ data: { enabled: true } });
};

// DELETE — disable 2FA (requires current TOTP code)
export const DELETE: RequestHandler = async (event) => {
  const { user } = requireAuth(event);
  const body = await event.request.json().catch(() => ({}));
  const { code } = body;

  const current = await getUserTwoFactor(user.id);
  if (!current?.twoFactorEnabled) return errorResponse("2FA not enabled", 400);
  if (!current.twoFactorSecret) return errorResponse("2FA not configured", 400);
  if (!verifyTotpCode(current.twoFactorSecret, String(code ?? ""))) {
    return errorResponse("Invalid code", 400);
  }

  await disable2FA(user.id);
  return json({ data: { enabled: false } });
};
