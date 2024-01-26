import { api } from "~/utils/api";

export const useProviders = ({ userId }: { userId?: string }) => {
  const { data, isLoading, refetch, error } =
    api.user.getProvidersByUserId.useQuery(
      { userId: userId ?? "" },
      {
        enabled: userId !== undefined,
      }
    );

  return { data, isLoading, refetch, error };
};
