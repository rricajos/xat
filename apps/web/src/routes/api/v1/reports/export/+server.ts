import { requireAuth, errorResponse } from "$lib/server/api-auth";
import {
  getAgentReport,
  getInboxReport,
  getTeamReport,
  getLabelReport,
} from "$lib/server/services/report.service";
import type { RequestHandler } from "./$types";

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = String(row[h] ?? "").replace(/"/g, '""');
        return `"${val}"`;
      }).join(","),
    ),
  ];
  return lines.join("\n");
}

export const GET: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const params = event.url.searchParams;
  const type = params.get("type") ?? "agents";
  const days = parseInt(params.get("days") ?? "30");

  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const accountId = account.id;

  let rows: Record<string, unknown>[] = [];
  let filename = "report.csv";

  if (type === "agents") {
    const data = await getAgentReport(accountId, since, now);
    rows = data.map((r) => ({
      agent_id: r.agent.id,
      agent_name: r.agent.name,
      conversations: r.conversationsCount,
      resolutions: r.resolutionCount,
    }));
    filename = `agents_report_${days}d.csv`;
  } else if (type === "inboxes") {
    const data = await getInboxReport(accountId, since, now);
    rows = data.map((r) => ({
      inbox_id: r.inbox.id,
      inbox_name: r.inbox.name,
      channel_type: r.inbox.channelType,
      conversations: r.conversationsCount,
    }));
    filename = `inboxes_report_${days}d.csv`;
  } else if (type === "teams") {
    const data = await getTeamReport(accountId, since, now);
    rows = data.map((r) => ({
      team_id: r.team.id,
      team_name: r.team.name,
      conversations: r.conversationsCount,
    }));
    filename = `teams_report_${days}d.csv`;
  } else if (type === "labels") {
    const data = await getLabelReport(accountId, since, now);
    rows = data.map((r) => ({
      label_id: r.label.id,
      label_title: r.label.title,
      conversations: r.conversationsCount,
    }));
    filename = `labels_report_${days}d.csv`;
  } else {
    return errorResponse("Invalid type. Use: agents, inboxes, teams, labels", 400);
  }

  const csv = toCSV(rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
};
