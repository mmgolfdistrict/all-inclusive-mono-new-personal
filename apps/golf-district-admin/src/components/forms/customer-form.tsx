import { useState } from "react";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { DollarSign } from "../icons/dollar-sign";
import { ReadOnly } from "../icons/read-only";
import { Input } from "../input/input";
import { Select } from "../input/select";
import { Switch } from "../input/switch";
import { Wrapper } from "./wrapper";

export const CustomerForm = ({
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
            {isEdit ? "Edit" : "New"} Customer
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
          <div className="flex items-end gap-2">
            <Input
              name="firstName"
              register={() => undefined}
              className="w-full"
              label="First Name"
              placeholder="Enter first name"
            />
            <Input
              name="lastName"
              register={() => undefined}
              className="w-full"
              label="Last Name"
              placeholder="Enter last name"
            />
          </div>
          <div className="flex items-end gap-2">
            <Input
              name="email"
              register={() => undefined}
              className="w-full"
              label="Email"
              placeholder="Enter email"
              type="email"
            />
            <Input
              name="phone"
              register={() => undefined}
              className="w-full"
              label="Phone"
              placeholder="Enter phone"
              type="tel"
            />
          </div>
          <div className="flex items-end gap-2">
            <Input
              name="password"
              register={() => undefined}
              className="w-full"
              label="Password"
              placeholder="Enter password"
              type="password"
            />
            <Input
              name="confirmPassword"
              register={() => undefined}
              className="w-full"
              label="Confirm Password"
              placeholder="Enter password again"
              type="password"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select
              values={["Public", "Private"]}
              value={"Public"}
              setValue={() => undefined}
              label="Privacy Settings"
              placeholder="Select Privacy Setting"
            />
            <Input
              name="availableBalance"
              register={() => undefined}
              className="w-full"
              label="Available Balance"
              defaultValue={"0.00"}
              icon={<DollarSign />}
              isReadOnly={true}
            />
          </div>
          <div className="flex items-start gap-2">
            <div className="w-full flex flex-col gap-2">
              <p>Notifications</p>
              <div className="w-full flex items-center gap-2 text-[14px]">
                <Switch value={true} setValue={() => undefined} />
                <div className="text-primary-gray">By Phone</div>
              </div>
              <div className="w-full flex items-center gap-2 text-[14px]">
                <Switch value={true} setValue={() => undefined} />
                <div className="text-primary-gray">By Email</div>
              </div>
            </div>
            {isEdit ? (
              <div className="flex gap-2 items-center w-full">
                <Avatar className="min-h-[64px] min-w-[64px] max-h-[64px] max-w-[64px] h-[64px] w-[64px]" />
                <p>Profile Photo</p>
                <ReadOnly />
              </div>
            ) : (
              <div className="w-full" />
            )}
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
