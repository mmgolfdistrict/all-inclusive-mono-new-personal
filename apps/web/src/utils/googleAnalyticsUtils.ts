type GoogleAnalyticsEvent = {
  action: string;
  category: string;
  label: string;
  value?: string | number;
};

declare global {
  interface Window {
    gtag: (
      event: string,
      action: string,
      params: Record<string, unknown>
    ) => void;
  }
}

export const googleAnalyticsEvent = ({
  action,
  category,
  label,
  value,
}: GoogleAnalyticsEvent) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  } else {
    console.warn("Google Analytics is not loaded or gtag is not available.");
  }
};
