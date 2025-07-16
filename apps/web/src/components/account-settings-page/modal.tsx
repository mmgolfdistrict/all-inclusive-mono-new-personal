// Modal.js

import React, { useEffect, useState } from "react";
import { OutlineButton } from "../buttons/outline-button";
import { Close } from "../icons/close";
import { Info } from "../icons/info";
import { Spinner } from "../loading/spinner";
import { Tooltip } from "../tooltip";
import FinixForm from "./FinixWidget";

const Modal = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
    }
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
        >
          <div className="h-screen bg-[#00000099]" />
        </div>
      )}
      <aside
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[31.25rem] md:h-[100dvh] ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="bg-white p-6 flex flex-col justify-between rounded-md h-full w-full">
          <div className="flex flex-col h-full pb-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Add Bank Account</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={onClose}
              >
                <Close className="h-[1.5625rem] w-[1.5625rem]" />
              </button>
            </div>
            <h5 className="text-justify text-sm font-semibold">
              Golf District does not store any bank details. They are directly
              handled by our payment processing 3rd-party partners.
            </h5>
            {isLoading && (
              <div className="flex justify-center items-center m-auto h-full w-full">
                <Spinner className="w-[3.125rem] h-[3.125rem]" />
              </div>
            )}
            {isOpen && (
              <FinixForm
                onClose={onClose}
                setLoading={setIsLoading}
                loading={isLoading}
              />
            )}
          </div>
          {!isLoading && (
            <>
              <OutlineButton onClick={onClose} className="w-full">
                Cancel
              </OutlineButton>

              <div className="mt-2 flex gap-1">
                <h5 className="text-justify text-sm font-semibold text-primary-gray">
                  Are you having issues adding your bank?
                </h5>
                <Tooltip
                  trigger={<Info className="h-[1.25rem] w-[1.25rem]" />}
                  content="Please ensure the address in your account settings matches the associated bank address above. Otherwise, your verification will be delayed, and you will be unable to cash out. If there are issues, please recheck and try again."
                />
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default Modal;
