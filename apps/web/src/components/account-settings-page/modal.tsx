// Modal.js

import React from "react";
import FinixForm from "./FinixWidget";

const Modal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* <div className="absolute inset-0 bg-black opacity-0"></div> */}
      <div className="bg-white p-6 rounded-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Modal Title</h2>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <FinixForm onClose={onClose} />
      </div>
    </div>
  );
};

export default Modal;
