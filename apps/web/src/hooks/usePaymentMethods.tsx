import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { useMemo } from "react";

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
    return data?.data;
  }, [data]);

  return { cards, refetch, isLoading };
};
