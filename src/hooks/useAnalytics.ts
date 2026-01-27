interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export const useAnalytics = () => {
  const trackEvent = ({ action, category, label, value }: AnalyticsEvent) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  };

  return { trackEvent };
};

// TypeScript type declaration
declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'js',
      action: string,
      params?: {
        event_category?: string;
        event_label?: string;
        value?: number;
        [key: string]: string | number | undefined;
      },
    ) => void;
  }
}
