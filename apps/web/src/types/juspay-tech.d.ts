declare module '@juspay-tech/hyper-js' {
  export function loadHyper(publishableKey: string): Promise<HyperInstance>;
}

interface HyperInstance {
    retrievePaymentIntent(clientSecret: string): Promise<{ paymentIntent?: { status?: string } }>;
    confirmPayment(params: unknown): Promise<unknown>;
    initiateUpdateIntent(): Promise<unknown>;
    completeUpdateIntent(clientSecret: string): Promise<unknown>;
    [key: string]: unknown;
  }

declare module '@juspay-tech/react-hyper-js' {
  import type { ReactNode } from 'react';
  
  interface HyperElementsProps {
    options: {
      clientSecret: string;
      paymentId: string | undefined;
      appearance: {
        theme: string;
      };
    };
    hyper: Promise<HyperInstance>;
    children: ReactNode;
  }
  
  export function HyperElements(props: HyperElementsProps): JSX.Element;
  export function UnifiedCheckout(props: { id: string; options: unknown }): JSX.Element;
  export function useHyper(): HyperInstance;
  export function useWidgets(): unknown;
} 