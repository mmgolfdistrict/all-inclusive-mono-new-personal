import { useState } from "react";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Input } from "../input/input";
import { Select } from "../input/select";
import { Textarea } from "../input/textarea";
import { ModalWrapper } from "../modals/modal-wrapper";
import { Wrapper } from "./wrapper";

export const TeeSheetForm = ({
  isEdit,
  onClose,
}: {
  isEdit?: boolean;
  onClose: () => void;
}) => {
  const [status, setStatus] = useState<string>("Active");
  const [agreesToChange, setAgreesToChange] = useState<boolean>(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState<boolean>(false);

  const openChangeModal = () => {
    setIsChangeModalOpen(true);
  };

  const closeChangeModal = () => {
    setIsChangeModalOpen(false);
  };

  const handleAgreesToChange = () => {
    setAgreesToChange(true);
    closeChangeModal();
  };

  return (
    <>
      <Wrapper>
        <form className="flex flex-col gap-4 text-[14px] items-center">
          <div className="flex w-full justify-between items-center">
            <h1 className="font-500 text-[24px]">
              {isEdit ? "Edit" : "New"} Tee Sheet
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
                setValue={(val: string) => {
                  if (!agreesToChange) {
                    openChangeModal();
                    return;
                  }
                  setStatus(val);
                }}
                label="Status"
                placeholder="Select Status"
              />
            </div>
            <Input
              name="internalName"
              register={() => undefined}
              className="w-full"
              label="Internal Name"
              placeholder="Enter tee sheet internal name"
            />
            <Input
              name="name"
              register={() => undefined}
              className="w-full"
              label="Name"
              placeholder="Enter tee sheet name"
            />

            <Textarea
              name="jsonConfig"
              register={() => undefined}
              className="w-full"
              label="JSON Configuration"
              defaultValue={""}
              placeholder="Start typing here..."
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
      </Wrapper>
      {isChangeModalOpen && (
        <ModalWrapper
          isOpen={isChangeModalOpen}
          onClose={closeChangeModal}
          className="max-w-sm"
        >
          <div className="flex flex-col gap-6 w-full">
            <p>
              Changing this setting will affect other records. Do you want to
              continue?
            </p>
            <div className="flex items-center justify-end gap-2 w-full">
              <OutlineButton onClick={onClose}>Cancel</OutlineButton>
              <FilledButton onClick={handleAgreesToChange}>
                Contiune
              </FilledButton>
            </div>
          </div>
        </ModalWrapper>
      )}
    </>
  );
};
