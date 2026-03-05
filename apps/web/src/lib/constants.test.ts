import { describe, it, expect } from "vitest";
import {
  CONVERSATION_STATUS,
  CONVERSATION_PRIORITY,
  MESSAGE_TYPE,
  AVAILABILITY,
  CHANNEL_TYPE,
  ACCOUNT_ROLE,
} from "@xat/shared";

describe("CONVERSATION_STATUS", () => {
  it("should have all required statuses", () => {
    expect(CONVERSATION_STATUS.OPEN).toBe(0);
    expect(CONVERSATION_STATUS.RESOLVED).toBe(1);
    expect(CONVERSATION_STATUS.PENDING).toBe(2);
    expect(CONVERSATION_STATUS.SNOOZED).toBe(3);
  });

  it("should have unique values", () => {
    const values = Object.values(CONVERSATION_STATUS);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("CONVERSATION_PRIORITY", () => {
  it("should have all priority levels", () => {
    expect(CONVERSATION_PRIORITY.NONE).toBe(0);
    expect(CONVERSATION_PRIORITY.LOW).toBe(1);
    expect(CONVERSATION_PRIORITY.MEDIUM).toBe(2);
    expect(CONVERSATION_PRIORITY.HIGH).toBe(3);
    expect(CONVERSATION_PRIORITY.URGENT).toBe(4);
  });
});

describe("MESSAGE_TYPE", () => {
  it("should have all message types", () => {
    expect(MESSAGE_TYPE.INCOMING).toBe(0);
    expect(MESSAGE_TYPE.OUTGOING).toBe(1);
    expect(MESSAGE_TYPE.ACTIVITY).toBe(2);
    expect(MESSAGE_TYPE.TEMPLATE).toBe(3);
  });
});

describe("AVAILABILITY", () => {
  it("should have online, busy, and offline", () => {
    expect(AVAILABILITY.ONLINE).toBe(0);
    expect(AVAILABILITY.BUSY).toBe(1);
    expect(AVAILABILITY.OFFLINE).toBe(2);
  });
});

describe("CHANNEL_TYPE", () => {
  it("should include all supported channels", () => {
    const types = Object.values(CHANNEL_TYPE);
    expect(types).toContain("web_widget");
    expect(types).toContain("email");
    expect(types).toContain("api");
    expect(types).toContain("whatsapp");
    expect(types).toContain("facebook");
    expect(types).toContain("telegram");
    expect(types).toContain("instagram");
    expect(types).toContain("twitter");
    expect(types).toContain("line");
    expect(types).toContain("sms");
  });
});

describe("ACCOUNT_ROLE", () => {
  it("should have all roles", () => {
    expect(ACCOUNT_ROLE.OWNER).toBe("owner");
    expect(ACCOUNT_ROLE.ADMINISTRATOR).toBe("administrator");
    expect(ACCOUNT_ROLE.AGENT).toBe("agent");
  });
});
