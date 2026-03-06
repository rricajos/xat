/**
 * Shared test utilities, factories, and helpers for unit tests.
 */

import { vi } from "vitest";

/**
 * Create a mock database result for use in service tests.
 * Returns objects that match Drizzle query result shapes.
 */
export function createMockContact(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    accountId: 1,
    name: "Test Contact",
    email: "test@example.com",
    phoneNumber: "+1234567890",
    avatarUrl: null,
    identifier: null,
    additionalAttributes: {},
    customAttributes: {},
    companyId: null,
    lastActivityAt: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

export function createMockConversation(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    accountId: 1,
    inboxId: 1,
    contactId: 1,
    assigneeId: null,
    teamId: null,
    displayId: 1,
    status: 0,
    priority: null,
    additionalAttributes: {},
    customAttributes: {},
    lastActivityAt: new Date("2025-01-01"),
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

export function createMockMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    accountId: 1,
    conversationId: 1,
    content: "Hello",
    messageType: 0,
    contentType: "text",
    senderType: "contact",
    senderId: 1,
    private: false,
    status: "sent",
    sourceId: null,
    externalSourceIds: {},
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

export function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Test Agent",
    displayName: null,
    email: "agent@example.com",
    passwordDigest: "hashed",
    type: "user",
    avatarUrl: null,
    availability: 0,
    uiSettings: {},
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

export function createMockInbox(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    accountId: 1,
    name: "Test Inbox",
    channelType: "web_widget",
    channelId: 1,
    greetingEnabled: false,
    greetingMessage: null,
    enableAutoAssignment: true,
    enableEmailCollect: true,
    csatSurveyEnabled: false,
    allowMessagesAfterResolved: true,
    businessHoursEnabled: false,
    outOfOfficeMessage: null,
    settings: {},
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

export function createMockCompany(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    accountId: 1,
    name: "Test Company",
    domain: "test.com",
    description: null,
    customAttributes: {},
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

export function createMockLabel(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    accountId: 1,
    title: "test-label",
    description: null,
    color: "#1f93ff",
    showOnSidebar: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

/**
 * Helper to create a date N days ago from now.
 */
export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/**
 * Helper to create a date N hours ago from now.
 */
export function hoursAgo(n: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}
