import { api } from "~/utils/api";

export const useUser = (userId?: string) => {
  const { data, isLoading, refetch } = api.user.getUser.useQuery(
    {
      userId: userId!,
    },
    {
      enabled: !!userId,
    }
  );
  return { data, isLoading, refetch };
};
