import { useElementByIdDimensions } from "~/hooks/useElementByIdDimensions";
import type { ReactNode } from "react";

export const Wrapper = ({ children }: { children: ReactNode }) => {
  const { width, height } = useElementByIdDimensions("sectionView");
  return (
    <div
      style={{ width: `${width}px`, height: `${height}px` }}
      className="overflow-auto absolute z-[100] fade-in -top-10 -left-12 py-10 px-12 bg-white"
    >
      {children}
    </div>
  );
};
