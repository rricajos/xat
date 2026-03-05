import Widget from "./Widget.svelte";

interface XatWidgetSettings {
  websiteToken: string;
  baseUrl?: string;
  locale?: string;
  position?: "left" | "right";
  type?: "standard" | "expanded_bubble";
  launcherTitle?: string;
}

declare global {
  interface Window {
    xatSettings?: XatWidgetSettings;
    $xat?: {
      toggle: () => void;
      open: () => void;
      close: () => void;
      setUser: (user: Record<string, unknown>) => void;
      setLabel: (label: string) => void;
      removeLabel: (label: string) => void;
    };
  }
}

function init() {
  const settings = window.xatSettings;
  if (!settings?.websiteToken) {
    console.error("[Xat] Missing websiteToken in xatSettings");
    return;
  }

  // Create container
  const container = document.createElement("div");
  container.id = "xat-widget-container";
  document.body.appendChild(container);

  // Mount widget
  const widget = new Widget({
    target: container,
    props: {
      websiteToken: settings.websiteToken,
      baseUrl: settings.baseUrl || window.location.origin,
      locale: settings.locale || "en",
      position: settings.position || "right",
      launcherTitle: settings.launcherTitle || "Chat with us",
    },
  });

  // Expose global API
  window.$xat = {
    toggle: () => widget.toggle(),
    open: () => widget.open(),
    close: () => widget.close(),
    setUser: (user) => widget.setUser(user),
    setLabel: (label) => widget.setLabel(label),
    removeLabel: (label) => widget.removeLabel(label),
  };
}

// Auto-init when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
