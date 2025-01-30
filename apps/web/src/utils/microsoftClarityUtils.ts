interface Clarity {
  (action: string, ...args: unknown[]): void;
  set(action: string, data: object): void;
}

declare global {
  interface Window {
    clarity?: Clarity;
  }
}

export const microsoftClarityEvent = ({
  action,
  category,
  label,
  value,
  additionalContent,
}: {
  action: string;
  category: string;
  label: string;
  value?: string;
  additionalContent?: any;
}) => {
  if (window.clarity) {
    if (additionalContent) {
      window.clarity("set", "name", additionalContent?.courseName);
      window.clarity("set", "website", additionalContent?.websiteURL);
      window.clarity("set", "source", window.location.href);
    }

    window.clarity("set", "customEvent", {
      action,
      category,
      label,
      value,
    });
    // console.log(action,
    //     category,
    //     label,
    //     value, "microsoftClarityEvent");
  } else {
    console.warn("Microsoft Clarity is not loaded or not available.");
  }
};
