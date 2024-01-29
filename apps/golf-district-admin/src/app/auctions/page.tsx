"use client";

import { NoOutlineButton } from "~/components/buttons/no-outline-button";
import { OutlineButton } from "~/components/buttons/outline-button";
import { AuctionForm } from "~/components/forms/auction-form";
import { Plus } from "~/components/icons/plus";
import { Auctions } from "~/components/tables/auctions";
import { useState } from "react";

export default function AdminAuctions() {
  const [isNewAuctionOpen, setIsNewAuctionOpen] = useState<boolean>(false);

  const openNewAuction = () => {
    setIsNewAuctionOpen(true);
  };

  const onCloseNewAuction = () => {
    setIsNewAuctionOpen(false);
  };

  return (
    <main className="flex flex-col gap-6 w-full relative">
      <section className="flex w-full justify-between items-center mt-[4rem] whitespace-nowrap">
        <h1 className="font-500 text-[24px]">Auctions</h1>
        <div className="flex items-center gap-2">
          <NoOutlineButton>Edit Columns</NoOutlineButton>
          <OutlineButton
            className="flex items-center gap-2"
            onClick={openNewAuction}
          >
            <Plus /> New
          </OutlineButton>
        </div>
      </section>
      <section>
        <Auctions />
      </section>
      {isNewAuctionOpen && (
        <AuctionForm isEdit={false} onClose={onCloseNewAuction} />
      )}
    </main>
  );
}
