import { formatMoney } from "~/utils/formatters";
import { HyperSwitch } from "../checkout-page/hyper-switch";
import { ModalWrapper } from "./modal-wrapper";

export const BuyNowCheckout = ({
  isOpen,
  onClose,
  buyNowPrice,
  auctionId,
}: {
  isOpen: boolean;
  onClose: () => void;
  buyNowPrice: number;
  auctionId: string;
}) => {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
      <HyperSwitch
        setCheckIfHyperSessionIsBuild={()=>undefined}
        teeTimeId=""
        isBuyNowAuction={true}
        //@ts-ignore
        cartData={[
          {
            name: "Golf District Auction",
            id: "1234",
            price: buyNowPrice * 100, //TODO - get math util to dont have rounding error
            image: "", //
            currency: "USD", //USD
            display_price: formatMoney(buyNowPrice),
            product_data: {
              metadata: {
                type: "auction",
                auction_id: auctionId,
              },
            },
          },
        ]}
        listingId={undefined}
        teeTimeDate={undefined}
      />
    </ModalWrapper>
  );
};
