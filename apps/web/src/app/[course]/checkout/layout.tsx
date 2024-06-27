import { CheckoutWrapper } from "~/contexts/CheckoutContext";
import { type ReactNode } from "react";

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  // const nicInfos = getNICDetails();

  return <CheckoutWrapper>{children}</CheckoutWrapper>;
}
