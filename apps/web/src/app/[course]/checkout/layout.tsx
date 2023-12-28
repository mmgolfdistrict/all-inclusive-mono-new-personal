import { CheckoutWrapper } from "~/contexts/CheckoutContext";
import { type ReactNode } from "react";

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <CheckoutWrapper>{children}</CheckoutWrapper>;
}
