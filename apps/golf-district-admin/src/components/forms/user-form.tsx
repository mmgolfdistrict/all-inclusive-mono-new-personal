import { useState } from "react";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Checkbox } from "../input/checkbox";
import { Input } from "../input/input";
import { Select } from "../input/select";
import { Wrapper } from "./wrapper";

const courses = [
  "All Courses",
  "Course 1",
  "Course 2",
  "Course 3",
  "Course 4",
  "Course 5",
  "Course 6",
];

export const UserForm = ({
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
            {isEdit ? "Edit" : "New"} User
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
          <Select
            values={["Persona 1", "Persona 2"]}
            value={"Persona 1"}
            setValue={() => undefined}
            label="Persona"
            placeholder="Select Persona"
          />
          <div className="w-full flex flex-col gap-1 pt-2 text-primary-gray">
            <p>Select Associated Courses</p>
            <div className="w-full rounded-sm flex flex-col gap-1 border border-[#B0B7BC] p-3 max-h-[150px] overflow-auto">
              {courses.map((course, idx) => (
                <Checkbox label={course} key={idx} />
              ))}
            </div>
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
