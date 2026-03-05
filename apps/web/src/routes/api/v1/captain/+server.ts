import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth, errorResponse } from "$lib/server/api-auth";
import {
  suggestReply,
  adjustTone,
  fixGrammar,
  summarizeConversation,
  translateMessage,
} from "$lib/server/services/captain.service";

export const POST: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const body = await event.request.json();

  const { action, conversationContext, text, tone, targetLanguage } = body as {
    action: string;
    conversationContext?: {
      contactName: string;
      messages: Array<{ role: "customer" | "agent"; content: string }>;
    };
    text?: string;
    tone?: "professional" | "friendly" | "direct" | "casual";
    targetLanguage?: string;
  };

  try {
    switch (action) {
      case "suggest_reply": {
        if (!conversationContext) {
          return errorResponse("conversationContext is required", 400);
        }
        const suggestion = await suggestReply(conversationContext);
        return json({ data: { result: suggestion } });
      }

      case "adjust_tone": {
        if (!text || !tone) {
          return errorResponse("text and tone are required", 400);
        }
        const adjusted = await adjustTone(text, tone);
        return json({ data: { result: adjusted } });
      }

      case "fix_grammar": {
        if (!text) {
          return errorResponse("text is required", 400);
        }
        const fixed = await fixGrammar(text);
        return json({ data: { result: fixed } });
      }

      case "summarize": {
        if (!conversationContext) {
          return errorResponse("conversationContext is required", 400);
        }
        const summary = await summarizeConversation(conversationContext);
        return json({ data: { result: summary } });
      }

      case "translate": {
        if (!text || !targetLanguage) {
          return errorResponse("text and targetLanguage are required", 400);
        }
        const translated = await translateMessage(text, targetLanguage);
        return json({ data: { result: translated } });
      }

      default:
        return errorResponse(`Unknown action: ${action}`, 400);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI service error";
    return errorResponse(message, 500);
  }
};
