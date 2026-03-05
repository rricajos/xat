import OpenAI from "openai";
import { env } from "$env/dynamic/private";

function getClient(): OpenAI {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
}

interface ConversationContext {
  contactName: string;
  messages: Array<{
    role: "customer" | "agent";
    content: string;
  }>;
}

export async function suggestReply(context: ConversationContext): Promise<string> {
  const client = getClient();

  const conversationHistory = context.messages
    .map((m) => `${m.role === "customer" ? context.contactName : "Agent"}: ${m.content}`)
    .join("\n");

  const response = await client.chat.completions.create({
    model: env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful customer support assistant. Based on the conversation below, suggest a professional and helpful reply for the agent to send. Only output the reply text, nothing else.",
      },
      {
        role: "user",
        content: `Conversation with ${context.contactName}:\n\n${conversationHistory}\n\nSuggest a reply:`,
      },
    ],
    max_tokens: 500,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}

export async function adjustTone(
  text: string,
  tone: "professional" | "friendly" | "direct" | "casual",
): Promise<string> {
  const client = getClient();

  const toneDescriptions: Record<string, string> = {
    professional: "formal, polished, and business-appropriate",
    friendly: "warm, approachable, and personable",
    direct: "concise, clear, and to the point",
    casual: "relaxed, informal, and conversational",
  };

  const response = await client.chat.completions.create({
    model: env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Rewrite the following message to have a ${toneDescriptions[tone]} tone. Only output the rewritten text, nothing else.`,
      },
      {
        role: "user",
        content: text,
      },
    ],
    max_tokens: 500,
    temperature: 0.5,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}

export async function fixGrammar(text: string): Promise<string> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Fix any grammar, spelling, and punctuation errors in the following text. Keep the meaning and tone the same. Only output the corrected text, nothing else.",
      },
      {
        role: "user",
        content: text,
      },
    ],
    max_tokens: 500,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}

export async function summarizeConversation(
  context: ConversationContext,
): Promise<string> {
  const client = getClient();

  const conversationHistory = context.messages
    .map((m) => `${m.role === "customer" ? context.contactName : "Agent"}: ${m.content}`)
    .join("\n");

  const response = await client.chat.completions.create({
    model: env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Summarize this customer support conversation in 2-3 concise sentences. Include the main issue and current status. Only output the summary.",
      },
      {
        role: "user",
        content: conversationHistory,
      },
    ],
    max_tokens: 200,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}

export async function translateMessage(
  text: string,
  targetLanguage: string,
): Promise<string> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Translate the following text to ${targetLanguage}. Only output the translation, nothing else.`,
      },
      {
        role: "user",
        content: text,
      },
    ],
    max_tokens: 500,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}
