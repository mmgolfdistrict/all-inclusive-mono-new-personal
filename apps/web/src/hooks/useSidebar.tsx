// import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { useEffect, type Dispatch, type SetStateAction } from "react";

export const useSidebar = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  // const trigger = useRef<HTMLButtonElement>(null);
  // const sidebar = useRef<HTMLElement>(null);

  // useEffect(() => {
  //   const clickHandler = ({ target }: MouseEvent) => {
  //     if (!sidebar.current || !trigger.current) return;
  //     if (
  //       !isOpen ||
  //       sidebar.current.contains(target as Node) ||
  //       trigger.current.contains(target as Node)
  //     ) {
  //       return;
  //     }
  //     setIsOpen(false);
  //   };

  //   document.addEventListener("click", clickHandler);
  //   return () => document.removeEventListener("click", clickHandler);
  // });

  useEffect(() => {
    const keyHandler = ({ code }: KeyboardEvent) => {
      if (!isOpen || code !== "Escape") return;
      setIsOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  const toggleSidebar = (): void => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [isOpen]);

  return {
    // trigger,
    // sidebar,
    toggleSidebar,
  };
};
