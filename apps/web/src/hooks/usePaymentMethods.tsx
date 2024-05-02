import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { useMemo } from "react";

export type CustomerPaymentMethod = {
  payment_token?: string;
  payment_method_id?: string;
  customer_id?: string;
  payment_method?: PaymentMethodType;
  payment_method_type?: string;
  payment_method_issuer?: string;
  payment_method_issuer_code?: string;
  recurring_enabled?: boolean;
  installment_payment_enabled?: boolean;
  payment_experience?: PaymentExperience[];
  card?: CardDetails;
  bank?: { mask: string };
  metadata?: object; // Optional object with string keys and values
  created?: string;
  surcharge_details?: object;
  requires_cvv?: boolean;
  last_used_at?: string;
  default_payment_method_set?: boolean;
  accountNumber?: string | null; 
  id?:string;
};

type PaymentMethodType =
  | "card"
  | "card_redirect"
  | "wallet"
  | "pay_later"
  | "bank_redirect"
  | "bank_transfer"
  | "crypto"
  | "bank_debit"
  | "reward"
  | "upi"
  | "voucher"
  | "gift_card";

type PaymentExperience =
  | "redirect_to_url"
  | "invoke_sdk_client"
  | "display_qr_code"
  | "one_click"
  | "link_wallet"
  | "invoke_payment_app"
  | "display_wait_screen";

type CardDetails = {
  scheme?: string;
  issuer_country?: string;
  last4_digits?: string;
  expiry_month?: string;
  expiry_year?: string;
  card_token?: string;
  card_holder_name?: string;
  card_fingerprint?: string;
  nick_name?: string;
  card_network?: CardNetwork;
  card_isin?: string;
  card_issuer?: string;
  card_type?: string;
  saved_to_locker: boolean;
};

type CardNetwork =
  | "Visa"
  | "Mastercard"
  | "AmericanExpress"
  | "JCB"
  | "DinersClub"
  | "Discover"
  | "CartesBancaires"
  | "UnionPay"
  | "Interac"
  | "RuPay"
  | "Maestro";

export const usePaymentMethods = () => {
  const { user } = useUserContext();
  const { data, refetch, isLoading } =
    api.checkout.retrievePaymentMethods.useQuery(
      {
        customerId: user?.id ?? "",
      },
      {
        enabled: user?.id !== undefined,
      }
    );

  const cards = useMemo(() => {
    if (!data) return [];
    return data as unknown as CustomerPaymentMethod[];
  }, [data]);

  return { cards, refetch, isLoading };
};
