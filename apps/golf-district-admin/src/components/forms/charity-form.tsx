import { useState } from "react";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Input } from "../input/input";
import { Select } from "../input/select";
import { Wrapper } from "./wrapper";

export const CharityForm = ({
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
            {isEdit ? "Edit" : "New"} Charity
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
            placeholder="Enter charity name"
          />

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
