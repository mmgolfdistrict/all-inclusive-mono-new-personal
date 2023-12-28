import { useEffect, useState, type RefObject } from "react";

export const useOverflowCheck = (
  ref: RefObject<HTMLDivElement>,
  deps: unknown[]
): { isOverflowingLeft: boolean; isOverflowingRight: boolean } => {
  const [isOverflowingLeft, setIsOverflowingLeft] = useState(false);
  const [isOverflowingRight, setIsOverflowingRight] = useState(false);

  useEffect(() => {
    const handleOverflowCheck = () => {
      if (ref.current) {
        setIsOverflowingLeft(ref.current.scrollLeft > 0);
        setIsOverflowingRight(
          ref.current.scrollWidth > ref.current.clientWidth &&
            ref.current.scrollLeft + 1 <
              ref.current.scrollWidth - ref.current.clientWidth
        );
      }
    };
    handleOverflowCheck();

    const handleScroll = () => {
      handleOverflowCheck();
    };
    const currentRef = ref.current;
    currentRef?.addEventListener("scroll", handleScroll);

    return () => {
      currentRef?.removeEventListener("scroll", handleScroll);
    };
  }, [ref, ...deps]);

  return { isOverflowingLeft, isOverflowingRight };
};
