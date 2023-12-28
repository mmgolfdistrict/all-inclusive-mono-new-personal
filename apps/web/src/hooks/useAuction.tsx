import { api } from "~/utils/api";

export const useAuction = (auctionId: string) => {
  const { data, isLoading, refetch } = api.auction.getAuctionById.useQuery(
    {
      auctionId: auctionId,
    },
    {
      enabled: !!auctionId,
    }
  );
  return { auctionData: data, isLoading, refetch };
};
