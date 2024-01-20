"use client";

import { FilledButton } from "~/components/buttons/filled-button";
import { NoOutlineButton } from "~/components/buttons/no-outline-button";
import { OutlineButton } from "~/components/buttons/outline-button";
import { ReservationForm } from "~/components/forms/reservation-form";
import { Plus } from "~/components/icons/plus";
import { SearchIcon } from "~/components/icons/search";
import { Date } from "~/components/input/date";
import { Input } from "~/components/input/input";
import { Reservations } from "~/components/tables/reservations";
import { useState } from "react";

export default function AdminReservations() {
  const [isNewReservationOpen, setIsNewReservationOpen] =
    useState<boolean>(false);

  const openNewReservation = () => {
    setIsNewReservationOpen(true);
  };

  const onCloseNewReservation = () => {
    setIsNewReservationOpen(false);
  };

  return (
    <>
      <main className="flex flex-col gap-6 w-full relative">
        <form className="flex w-full gap-2">
          <Input
            name="search"
            register={() => undefined}
            className="w-full min-w-[135px]"
            icon={<SearchIcon />}
            placeholder="Search by customer name, email, reservation number, course"
          />
          <Date
            name="startDate"
            register={() => undefined}
            placeholder="Start Date"
            id="startDate"
            className="min-w-[135px]"
          />
          <Date
            name="endDate"
            register={() => undefined}
            placeholder="End Date"
            id="endDate"
            className="min-w-[135px]"
          />
          <FilledButton>Search</FilledButton>
        </form>
        <section className="flex w-full justify-between items-center mt-4 whitespace-nowrap">
          <h1 className="font-500 text-[24px]">Reservations</h1>
          <div className="flex items-center gap-2">
            <NoOutlineButton>Edit Columns</NoOutlineButton>
            <NoOutlineButton>Export</NoOutlineButton>
            <OutlineButton
              className="flex items-center gap-2"
              onClick={openNewReservation}
            >
              <Plus /> New
            </OutlineButton>
          </div>
        </section>
        <section>
          <Reservations />
        </section>
        {isNewReservationOpen && (
          <ReservationForm isEdit={false} onClose={onCloseNewReservation} />
        )}
      </main>
    </>
  );
}
