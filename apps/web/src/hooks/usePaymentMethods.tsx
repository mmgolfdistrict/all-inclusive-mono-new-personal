import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { useMemo } from "react";

export type Card = {
  id: string;
  object: string;
  card: {
    country: null | string;
    last4: string;
    exp_month: string;
    exp_year: string;
    fingerprint: null | string;
  };
  created: number[];
};
export const usePaymentMethods = () => {
  const { user } = useUserContext();
  const { data, refetch, isLoading } =
    api.checkout.retrievePaymentMethods.useQuery(
      {
        customerId: user?.id ?? "",
        params: {
          type: "card",
        },
      },
      {
        enabled: user?.id !== undefined,
      }
    );

  const cards = useMemo(() => {
    if (!data) return [];
    return data?.data as unknown as Card[];
  }, [data]);

  return { cards, refetch, isLoading };
};
