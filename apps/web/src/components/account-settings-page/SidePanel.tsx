import React, { type FC, type ReactNode } from "react";

interface SidePanelProps {
  isOpen: boolean;
  children: ReactNode;
}

const SidePanel: FC<SidePanelProps> = ({ isOpen, children }) => {
  return (
    <>
      {isOpen && (
        <div className="fixed left-0 top-0 z-20 h-screen w-screen">
          <div className="h-screen bg-[#817e7e2e]" />
        </div>
      )}
      <aside
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[100vh] w-[70vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[31.25rem] md:h-screen ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {children}
      </aside>
    </>
  );
};

export default SidePanel;
