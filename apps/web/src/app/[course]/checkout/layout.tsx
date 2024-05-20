import { CheckoutWrapper } from "~/contexts/CheckoutContext";
import { getNICDetails } from "~/utils/ipUtility";
import { type ReactNode } from "react";

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  const nicInfos = getNICDetails();
  console.log("NIC Details");
  console.log(nicInfos);

  return <CheckoutWrapper>{children}</CheckoutWrapper>;
}
