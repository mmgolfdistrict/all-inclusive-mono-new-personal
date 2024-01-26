import { useState } from "react";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { DollarSign } from "../icons/dollar-sign";
import { Date } from "../input/date";
import { Input } from "../input/input";
import { Select } from "../input/select";
import { Textarea } from "../input/textarea";
import { Wrapper } from "./wrapper";

export const AuctionForm = ({
  isEdit,
  onClose,
}: {
  isEdit?: boolean;
  onClose: () => void;
}) => {
  const [status, setStatus] = useState<string>("Active");

  return (
    <Wrapper>
      <form className="flex flex-col gap-4 text-[14px] items-center">
        <div className="flex w-full justify-between items-center">
          <h1 className="font-500 text-[24px]">
            {isEdit ? "Edit" : "New"} Auction
          </h1>
          <div className="flex items-center gap-2">
            <OutlineButton className="min-w-[90px]" onClick={onClose}>
              Cancel
            </OutlineButton>
            <FilledButton className="min-w-[90px]">Save</FilledButton>
          </div>
        </div>
        <section className="flex flex-col gap-2 w-full max-w-[600px] text-primary-gray mt-2 pb-10">
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
              placeholder="Select Status"
            />
          </div>
          <Input
            name="name"
            register={() => undefined}
            className="w-full"
            label="Name"
            placeholder="Enter auction name"
          />
          <Select
            values={["Encinitas Ranch"]}
            value={""}
            setValue={() => undefined}
            label="Golf Course"
            placeholder="Select a golf course"
          />
          <Textarea
            name="description"
            register={() => undefined}
            className="w-full"
            label="Description"
            defaultValue={""}
            placeholder="Start typing here..."
            rows={4}
          />
          <div className="flex items-end gap-2">
            <Input
              name="price"
              register={() => undefined}
              className="w-full"
              label="Price"
              placeholder="0.00"
              icon={<DollarSign />}
            />
            <Input
              name="startingBid"
              register={() => undefined}
              className="w-full"
              label="Starting Bid"
              placeholder="0.00"
              icon={<DollarSign />}
            />
          </div>
          <div className="flex items-end gap-2">
            <Input
              name="increment"
              register={() => undefined}
              className="w-full"
              label="Increment"
              placeholder="0.00"
              icon={<DollarSign />}
            />
            <Input
              name="maxBids"
              register={() => undefined}
              className="w-full"
              label="Max Number of Bids"
              placeholder="Enter max number of bids"
              type="number"
            />
          </div>
          <div className="flex items-end gap-2">
            <Date
              name="startDate"
              register={() => undefined}
              placeholder="Enter start date"
              label="Start Date"
              id="startDate"
              className="w-full"
            />
            <Date
              name="endDate"
              register={() => undefined}
              placeholder="Enter end date"
              label="End Date"
              id="endDate"
              className="w-full"
            />
          </div>
          <div className="flex items-center justify-end gap-2 w-full mt-4">
            <OutlineButton className="min-w-[90px]" onClick={onClose}>
              Cancel
            </OutlineButton>
            <FilledButton className="min-w-[90px]">Save</FilledButton>
          </div>
        </section>
      </form>
    </Wrapper>
  );
};
