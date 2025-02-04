import { CheckoutWrapper } from "~/contexts/CheckoutContext";
import { type ReactNode } from "react";

export default function CheckoutGroupLayout({ children }: { children: ReactNode }) {
  // const nicInfos = getNICDetails();

  return <CheckoutWrapper>{children}</CheckoutWrapper>;
}
