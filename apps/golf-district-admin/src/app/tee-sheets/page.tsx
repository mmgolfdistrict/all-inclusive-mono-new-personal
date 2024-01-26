"use client";

import { OutlineButton } from "~/components/buttons/outline-button";
import { TeeSheetForm } from "~/components/forms/tee-sheet-form";
import { Plus } from "~/components/icons/plus";
import { TeeSheets } from "~/components/tables/tee-sheets";
import { useState } from "react";

export default function AdminTeeSheets() {
  const [isNewTeeSheetOpen, setIsNewTeeSheetOpen] = useState<boolean>(false);

  const openNewTeeSheet = () => {
    setIsNewTeeSheetOpen(true);
  };

  const onCloseNewTeeSheet = () => {
    setIsNewTeeSheetOpen(false);
  };

  return (
    <main className="flex flex-col gap-6 w-full relative">
      <section className="flex w-full justify-between items-center mt-[4rem] whitespace-nowrap">
        <h1 className="font-500 text-[24px]">Tee Sheets</h1>
        <div className="flex items-center gap-2">
          <OutlineButton
            className="flex items-center gap-2"
            onClick={openNewTeeSheet}
          >
            <Plus /> New
          </OutlineButton>
        </div>
      </section>
      <section>
        <TeeSheets />
      </section>
      {isNewTeeSheetOpen && (
        <TeeSheetForm isEdit={false} onClose={onCloseNewTeeSheet} />
      )}
    </main>
  );
}
