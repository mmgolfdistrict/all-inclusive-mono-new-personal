// Modal.js

import React from "react";
import { OutlineButton } from "../buttons/outline-button";
import FinixForm from "./FinixWidget";

const Modal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[500px] md:h-[100dvh] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="bg-white p-6 rounded-md h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Add bank details</h2>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              Close
            </button>
          </div>
          <FinixForm onClose={onClose} />
          <OutlineButton onClick={onClose} className="w-full">
            Cancel
          </OutlineButton>
        </div>
      </aside>
    </>
  );
};

export default Modal;
