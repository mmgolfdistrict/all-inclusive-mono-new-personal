import { useState } from "react";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { DropMedia } from "../input/drop-media";
import { Input } from "../input/input";
import { Select } from "../input/select";
import { Textarea } from "../input/textarea";
import { Wrapper } from "./wrapper";

export const ManagementForm = ({
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
            {isEdit ? "Edit" : "New"} Management Company
          </h1>
          <div className="flex items-center gap-2">
            <OutlineButton className="min-w-[90px]">Preview</OutlineButton>
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
            placeholder="Enter management company name"
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
          <DropMedia
            label="Logo"
            id="logo"
            name="logo"
            register={() => undefined}
            allowMultiple={false}
            src={[]}
            dataTestId="logo-id"
          />
          <Select
            values={["Lexend", "Inter"]}
            value={""}
            setValue={() => undefined}
            label="Font"
            placeholder="Select a font"
          />
          <Input
            name="color"
            register={() => undefined}
            className="w-full"
            label="Color"
            placeholder="Enter a hex value"
          />
          <Input
            name="domain"
            register={() => undefined}
            className="w-full"
            label="Domain"
            placeholder="Enter domain URL"
            type="url"
          />
          <Input
            name="url"
            register={() => undefined}
            className="w-full"
            label="Website Url"
            placeholder="Enter website URL"
            type="url"
          />
          <Input
            name="404Message"
            register={() => undefined}
            className="w-full"
            label="404 Message"
            placeholder="Enter 404 message"
          />
          <DropMedia
            label="404 Image"
            id="404Image"
            name="404Image"
            register={() => undefined}
            allowMultiple={false}
            src={[]}
            dataTestId="404-image-id"
          />
          <div className="flex items-center justify-end gap-2 w-full mt-4">
            <OutlineButton className="min-w-[90px]">Preview</OutlineButton>
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
