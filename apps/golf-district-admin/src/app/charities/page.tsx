"use client";

import { OutlineButton } from "~/components/buttons/outline-button";
import { CharityForm } from "~/components/forms/charity-form";
import { Plus } from "~/components/icons/plus";
import { Charities } from "~/components/tables/charities";
import { useState } from "react";

export default function AdminCharities() {
  const [isNewCharityOpen, setIsNewCharityOpen] = useState<boolean>(false);

  const openNewCharity = () => {
    setIsNewCharityOpen(true);
  };

  const closeCharity = () => {
    setIsNewCharityOpen(false);
  };

  return (
    <main className="flex flex-col gap-6 w-full relative">
      <section className="flex w-full justify-between items-center mt-[4rem] whitespace-nowrap">
        <h1 className="font-500 text-[24px]">Charities</h1>
        <div className="flex items-center gap-2">
          <OutlineButton
            className="flex items-center gap-2"
            onClick={openNewCharity}
          >
            <Plus /> New
          </OutlineButton>
        </div>
      </section>
      <section>
        <Charities />
      </section>
      {isNewCharityOpen && (
        <CharityForm isEdit={false} onClose={closeCharity} />
      )}
    </main>
  );
}
