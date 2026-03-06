import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAdmin } from "$lib/server/api-auth";
import {
  getSamlConfig,
  saveSamlConfig,
  deleteSamlConfig,
} from "$lib/server/services/sso.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);
  const config = await getSamlConfig(account.id);

  return json({
    data: config
      ? {
          entityId: config.entityId,
          ssoUrl: config.ssoUrl,
          hasCertificate: !!config.certificate,
          sloUrl: config.sloUrl,
          nameIdFormat: config.nameIdFormat,
          attributeMapping: config.attributeMapping,
        }
      : null,
  });
};

export const POST: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);
  const body = await event.request.json();

  const { entityId, ssoUrl, certificate, sloUrl, nameIdFormat, attributeMapping } =
    body as {
      entityId?: string;
      ssoUrl?: string;
      certificate?: string;
      sloUrl?: string;
      nameIdFormat?: string;
      attributeMapping?: Record<string, string>;
    };

  if (!entityId || !ssoUrl || !certificate) {
    return json(
      { error: "entityId, ssoUrl, and certificate are required" },
      { status: 400 },
    );
  }

  await saveSamlConfig(account.id, {
    entityId,
    ssoUrl,
    certificate,
    sloUrl,
    nameIdFormat,
    attributeMapping,
  });

  return json({ message: "SSO configuration saved" });
};

export const DELETE: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);
  await deleteSamlConfig(account.id);
  return new Response(null, { status: 204 });
};
