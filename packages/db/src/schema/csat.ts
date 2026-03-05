import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  smallint,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { accounts } from "./accounts";
import { conversations } from "./conversations";
import { contacts } from "./contacts";
import { users } from "./users";
import { messages } from "./messages";

export const csatSurveyResponses = pgTable(
  "csat_survey_responses",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    messageId: integer("message_id").references(() => messages.id),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id),
    assignedAgentId: integer("assigned_agent_id").references(() => users.id),
    rating: smallint("rating").notNull(), // 1-5
    feedbackText: text("feedback_text"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("csat_account_created_idx").on(table.accountId, table.createdAt),
    index("csat_account_agent_idx").on(
      table.accountId,
      table.assignedAgentId,
    ),
  ],
);
