import { api } from "~/utils/api";
import { useMemo } from "react";

export const useMe = () => {
  const { data, isLoading, refetch } = api.auth.getSession.useQuery(
    undefined as never
  );
  const user = useMemo(() => {
    if (data) {
      return data?.user;
    }
    return undefined;
  }, [data]);
  return { user, isLoading, refetch };
};
