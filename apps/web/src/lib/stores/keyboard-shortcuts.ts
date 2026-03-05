import { goto } from "$app/navigation";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
  category: string;
}

function createShortcuts(): KeyboardShortcut[] {
  return [
    // Navigation
    {
      key: "1",
      alt: true,
      description: "Go to Conversations",
      action: () => goto("/app/conversations"),
      category: "Navigation",
    },
    {
      key: "2",
      alt: true,
      description: "Go to Contacts",
      action: () => goto("/app/contacts"),
      category: "Navigation",
    },
    {
      key: "3",
      alt: true,
      description: "Go to Reports",
      action: () => goto("/app/reports"),
      category: "Navigation",
    },
    {
      key: "4",
      alt: true,
      description: "Go to Campaigns",
      action: () => goto("/app/campaigns"),
      category: "Navigation",
    },
    {
      key: "5",
      alt: true,
      description: "Go to Help Center",
      action: () => goto("/app/help-center"),
      category: "Navigation",
    },
    {
      key: "6",
      alt: true,
      description: "Go to Settings",
      action: () => goto("/app/settings"),
      category: "Navigation",
    },
    // Conversation Actions
    {
      key: "d",
      alt: true,
      description: "Resolve conversation",
      action: () => {
        const btn = document.querySelector<HTMLButtonElement>(
          '[data-shortcut="resolve"]',
        );
        btn?.click();
      },
      category: "Conversation",
    },
    {
      key: "j",
      alt: true,
      description: "Next conversation",
      action: () => {
        const btn = document.querySelector<HTMLButtonElement>(
          '[data-shortcut="next-conversation"]',
        );
        btn?.click();
      },
      category: "Conversation",
    },
    {
      key: "k",
      alt: true,
      description: "Previous conversation",
      action: () => {
        const btn = document.querySelector<HTMLButtonElement>(
          '[data-shortcut="prev-conversation"]',
        );
        btn?.click();
      },
      category: "Conversation",
    },
    {
      key: "l",
      alt: true,
      description: "Toggle reply/note",
      action: () => {
        const btn = document.querySelector<HTMLButtonElement>(
          '[data-shortcut="toggle-note"]',
        );
        btn?.click();
      },
      category: "Conversation",
    },
  ];
}

export function initKeyboardShortcuts(
  onCommandBar: () => void,
): () => void {
  const shortcuts = createShortcuts();

  function handleKeydown(e: KeyboardEvent) {
    // Ignore when typing in inputs
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable
    ) {
      // Only handle Cmd+K / Ctrl+K in inputs
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onCommandBar();
      }
      return;
    }

    // Cmd+K / Ctrl+K — Command Bar
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      onCommandBar();
      return;
    }

    // ? — Show shortcuts help
    if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const btn = document.querySelector<HTMLButtonElement>(
        '[data-shortcut="show-help"]',
      );
      btn?.click();
      return;
    }

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl
        ? e.ctrlKey
        : shortcut.meta
          ? e.metaKey
          : true;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;

      if (e.key === shortcut.key && ctrlMatch && altMatch && shiftMatch) {
        e.preventDefault();
        shortcut.action();
        return;
      }
    }
  }

  window.addEventListener("keydown", handleKeydown);
  return () => window.removeEventListener("keydown", handleKeydown);
}

export function getShortcutsList(): KeyboardShortcut[] {
  return createShortcuts();
}
