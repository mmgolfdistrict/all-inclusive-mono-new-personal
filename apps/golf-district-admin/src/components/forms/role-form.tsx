import { useState } from "react";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Checkbox } from "../input/checkbox";
import { Input } from "../input/input";
import { Select } from "../input/select";
import { Wrapper } from "./wrapper";

const general = [
  "View Course Management Companies",
  "View Courses",
  "View Customers",
  "View Payment Processors",
  "View Tee Sheets",
  "View Charities",
  "View Users",
  "View Roles",
  "View Auctions",
];

const course = [
  "Allow New Course Creation",
  "Allow General Edit",
  "Allow Tee Sheet Edit",
  "Allow Payment Processor Edit",
  "Allow Monetization Edit",
  "Allow Domain Edit",
];

const reservation = [
  "Allow New Reservation",
  "Allow Resercation Markup and Transaction Fee View",
  "Allow Tee Time Transaction History View",
  "Allow Reservation Cancellation",
  "Allow Reservation Edit",
  "Allow Markup/Transaction Fee Edit",
  "Allow Reservation Export",
];

const _customer = ["Allow Edit Customer", "Allow List Customer", ""];

export const RoleForm = ({
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
        <div className="flex w-full justify-between gap-2 items-center">
          <h1 className="font-500 text-[24px]">
            {isEdit ? "Edit" : "New"} Role
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
              placeholder="Select Status"
            />
          </div>
          <Input
            name="roleName"
            register={() => undefined}
            className="w-full"
            label="Name"
            placeholder="Enter role name"
          />

          <section className="w-full flex flex-col gap-1 pt-2 text-primary-gray">
            <p className="text-black">General</p>
            <div className="w-full flex flex-col gap-1 p-3">
              {general.map((course, idx) => (
                <Checkbox label={course} key={idx} />
              ))}
            </div>
          </section>

          <section className="w-full flex flex-col gap-1 pt-2 text-primary-gray">
            <p className="text-black">Course</p>
            <div className="w-full flex flex-col gap-1 p-3">
              {course.map((course, idx) => (
                <Checkbox label={course} key={idx} />
              ))}
            </div>
          </section>

          <section className="w-full flex flex-col gap-1 pt-2 text-primary-gray">
            <p className="text-black">Reservation</p>
            <div className="w-full flex flex-col gap-1 p-3">
              {reservation.map((course, idx) => (
                <Checkbox label={course} key={idx} />
              ))}
            </div>
          </section>

          <section className="w-full flex flex-col gap-1 pt-2 text-primary-gray">
            <p className="text-black">Customer</p>
            <div className="w-full flex flex-col gap-1 p-3">
              {general.map((course, idx) => (
                <Checkbox label={course} key={idx} />
              ))}
            </div>
          </section>

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
