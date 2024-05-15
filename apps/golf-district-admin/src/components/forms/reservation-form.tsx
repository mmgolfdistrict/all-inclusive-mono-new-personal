import { useState } from "react";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Clock } from "../icons/clock";
import { DollarSign } from "../icons/dollar-sign";
import { Date } from "../input/date";
import { Input } from "../input/input";
import { Select } from "../input/select";
import { Switch } from "../input/switch";
import { Textarea } from "../input/textarea";
import { TransactionHistory } from "../tables/transaction-history";
import { Wrapper } from "./wrapper";

export const ReservationForm = ({
  isEdit,
  onClose,
}: {
  isEdit?: boolean;
  onClose: () => void;
}) => {
  const [status, setStatus] = useState<string>("Active");
  const [course, setCourse] = useState<string>("");

  return (
    <Wrapper>
      <form className="flex flex-col gap-4 items-center">
        <div className="flex w-full justify-between items-center">
          <h1 className="font-500 text-[24px]">
            {isEdit ? "Edit" : "New"} Reservation
          </h1>
          <div className="flex items-center gap-2">
            <OutlineButton className="min-w-[90px]" onClick={onClose}>
              Cancel
            </OutlineButton>
            <FilledButton className="min-w-[90px]">Save</FilledButton>
          </div>
        </div>
        <section className="flex flex-col gap-2 w-full max-w-[600px] mt-2 pb-10">
          <div className="flex items-end gap-2">
            <Input
              name="ID"
              register={() => undefined}
              className="w-full"
              isReadOnly={true}
              label="ID"
              defaultValue={"1234"}
            />
            <Select
              values={["Active", "Inactive"]}
              value={status}
              setValue={setStatus}
              label="Status"
              isReadOnly={isEdit}
              placeholder="Select Status"
            />
          </div>
          <Select
            values={["Encinitas Ranch", "Torrey Pines"]}
            value={course}
            setValue={setCourse}
            label="Golf Course"
            isReadOnly={isEdit}
            placeholder="Select Golf Course"
          />
          <Select
            values={["Phone"]}
            value={"Phone"}
            setValue={setCourse}
            // @dev using setCourse here during layout, will switch to setValue from useForm hook and not use useState
            label="Booking Channel"
            isReadOnly={true}
            placeholder="Select Booking Channel"
          />
          <Select
            values={["Tee Sheet 23"]}
            value={"Tee Sheet 23"}
            setValue={setCourse}
            // @dev using setCourse here during layout, will switch to setValue from useForm hook and not use useState
            label="Tee Sheet"
            isReadOnly={true}
            placeholder="Select Tee Sheet"
          />
          <Select
            values={["Primary Market"]}
            value={"Primary Market"}
            setValue={setCourse}
            // @dev using setCourse here during layout, will switch to setValue from useForm hook and not use useState
            label="Transaction Type"
            isReadOnly={true}
            placeholder="Select Transaction Type"
          />
          <Input
            name="customerName"
            register={() => undefined}
            className="w-full"
            isReadOnly={isEdit}
            label="Customer Name"
            defaultValue={""}
            placeholder="Start typeing cumstomer name..."
          />
          <div className="flex items-end gap-2">
            <Date
              name="bookingDate"
              register={() => undefined}
              placeholder="Booking Date"
              label="Booking Date"
              id="bookingDate"
              className="w-full"
            />
            <Select
              values={["10:00AM", "11:00AM", "12:00PM"]}
              value={""}
              setValue={setCourse}
              // @dev using setCourse here during layout, will switch to setValue from useForm hook and not use useState
              label="Booking Time"
              isReadOnly={isEdit}
              placeholder="Select a time"
              icon={<Clock />}
            />
          </div>
          <div className="flex items-end gap-2">
            <Select
              values={["1", "2", "3", "4"]}
              value={"1"}
              setValue={setCourse}
              // @dev using setCourse here during layout, will switch to setValue from useForm hook and not use useState
              label="Number of Players"
              placeholder="Select amount of players"
            />
            <div className="w-full" />
          </div>
          <div className="flex items-end gap-2">
            <Input
              name="greenFees"
              register={() => undefined}
              className="w-full"
              isReadOnly={true}
              label="Green Fees (per player)"
              defaultValue={"4.99"}
              icon={<DollarSign />}
            />
            <Input
              name="taxes"
              register={() => undefined}
              className="w-full"
              isReadOnly={true}
              label="Taxes (per player)"
              defaultValue={"1.99"}
              icon={<DollarSign />}
            />
          </div>
          <div className="flex items-end gap-2">
            <Select
              values={["Cancer Society of America"]}
              value={""}
              setValue={setCourse}
              // @dev using setCourse here during layout, will switch to setValue from useForm hook and not use useState
              label="Selected Charitable Donation"
              placeholder="Select a charitable donation"
            />
            <Input
              name="taxes"
              register={() => undefined}
              className="w-full"
              label="Charity Amount"
              type="number"
              defaultValue={"0.00"}
              icon={<DollarSign />}
            />
          </div>
          <div className="flex items-end gap-2 py-2">
            <div className="w-full flex items-center gap-2 text-[14px]">
              <Switch value={true} setValue={() => undefined} />
              <div className="text-primary-gray">
                Sensible Weather: ${"3.49"}
              </div>
            </div>
            <div className="w-full" />
          </div>
          <div className="flex items-end gap-2">
            <Input
              name="convenienceFee"
              register={() => undefined}
              className="w-full"
              isReadOnly={true}
              label="Convenience Fee"
              defaultValue={"1.99"}
              icon={<DollarSign />}
            />
            <Input
              name="totalAmount"
              register={() => undefined}
              className="w-full"
              isReadOnly={true}
              label="Total Amount"
              defaultValue={"199.99"}
              icon={<DollarSign />}
            />
          </div>
          <Textarea
            name="notes"
            register={() => undefined}
            className="w-full"
            label="Notes"
            defaultValue={""}
            placeholder="Start typing notes..."
            rows={4}
          />
          <div className="flex items-center justify-end gap-2 w-full mt-4">
            <OutlineButton className="min-w-[90px]" onClick={onClose}>
              Cancel
            </OutlineButton>
            <FilledButton className="min-w-[90px]">Save</FilledButton>
          </div>
        </section>
      </form>
      {isEdit ? (
        <div className="max-w-[600px] w-full mx-auto">
          <TransactionHistory teeTimeId="1234" />
        </div>
      ) : null}
    </Wrapper>
  );
};
