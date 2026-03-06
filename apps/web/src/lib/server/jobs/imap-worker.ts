import { db } from "@xat/db";
import { channelEmail, inboxes } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { processInboundEmail } from "../channels/email";

/**
 * IMAP polling worker.
 * Connects to configured IMAP mailboxes and processes new emails.
 *
 * In production, this runs on a schedule via BullMQ repeatable jobs.
 */

interface ImapConfig {
  inboxId: number;
  accountId: number;
  email: string;
  host: string;
  port: number;
  login: string;
  password: string;
  enableSsl: boolean;
}

async function getImapEnabledInboxes(): Promise<ImapConfig[]> {
  const rows = await db
    .select({
      inboxId: inboxes.id,
      accountId: inboxes.accountId,
      email: channelEmail.email,
      host: channelEmail.imapAddress,
      port: channelEmail.imapPort,
      login: channelEmail.imapLogin,
      password: channelEmail.imapPassword,
      enableSsl: channelEmail.imapEnableSsl,
    })
    .from(inboxes)
    .innerJoin(
      channelEmail,
      and(
        eq(channelEmail.id, inboxes.channelId),
        eq(channelEmail.accountId, inboxes.accountId),
      ),
    )
    .where(
      and(
        eq(inboxes.channelType, "email"),
        eq(channelEmail.imapEnabled, true),
      ),
    );

  return rows.filter(
    (r): r is ImapConfig =>
      !!r.host && !!r.login && !!r.password && r.port !== null,
  );
}

async function pollMailbox(config: ImapConfig): Promise<number> {
  let processedCount = 0;

  try {
    const Imap = (await import("imap")).default;

    const imap = new Imap({
      user: config.login,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.enableSsl,
      tlsOptions: { rejectUnauthorized: false },
    });

    await new Promise<void>((resolve, reject) => {
      imap.once("ready", () => {
        imap.openBox("INBOX", false, (err: Error | null) => {
          if (err) {
            imap.end();
            reject(err);
            return;
          }

          // Search for unseen messages
          imap.search(["UNSEEN"], (searchErr: Error | null, results: number[]) => {
            if (searchErr || !results.length) {
              imap.end();
              resolve();
              return;
            }

            const fetch = imap.fetch(results, {
              bodies: ["HEADER.FIELDS (FROM TO SUBJECT MESSAGE-ID IN-REPLY-TO REFERENCES)", "TEXT"],
              markSeen: true,
            });

            fetch.on("message", (msg: { on: Function }) => {
              let headers = "";
              let body = "";

              msg.on("body", (stream: { on: Function }, info: { which: string }) => {
                let buffer = "";
                stream.on("data", (chunk: Buffer) => {
                  buffer += chunk.toString("utf8");
                });
                stream.on("end", () => {
                  if (info.which.startsWith("HEADER")) {
                    headers = buffer;
                  } else {
                    body = buffer;
                  }
                });
              });

              msg.on("end", async () => {
                const parseHeader = (name: string): string => {
                  const match = new RegExp(`^${name}:\\s*(.+)$`, "mi").exec(headers);
                  return match?.[1]?.trim() ?? "";
                };

                const from = parseHeader("From");
                const to = parseHeader("To");
                const subject = parseHeader("Subject");
                const messageId = parseHeader("Message-ID");
                const inReplyTo = parseHeader("In-Reply-To");

                // Extract email from "Name <email>" format
                const emailMatch = /<([^>]+)>/.exec(from);
                const fromEmail = emailMatch?.[1] ?? from;
                const fromName = from.replace(/<[^>]+>/, "").trim() || undefined;

                try {
                  await processInboundEmail(config.accountId, config.inboxId, {
                    from: fromEmail,
                    fromName,
                    to,
                    subject,
                    textBody: body,
                    messageId,
                    inReplyTo: inReplyTo || undefined,
                  });
                  processedCount++;
                } catch (e) {
                  console.error(`[imap] Error processing email from ${fromEmail}:`, e);
                }
              });
            });

            fetch.once("end", () => {
              imap.end();
              resolve();
            });
          });
        });
      });

      imap.once("error", (err: Error) => {
        reject(err);
      });

      imap.connect();
    });
  } catch (e) {
    console.error(`[imap] Error polling mailbox ${config.email}:`, e);
  }

  return processedCount;
}

export async function pollAllMailboxes(): Promise<number> {
  const configs = await getImapEnabledInboxes();

  if (configs.length === 0) {
    return 0;
  }

  let total = 0;
  for (const config of configs) {
    const count = await pollMailbox(config);
    total += count;
    if (count > 0) {
      console.log(`[imap] Processed ${count} emails from ${config.email}`);
    }
  }

  return total;
}
