"use client";

import { useAppContext } from "~/contexts/AppContext";

export const CourseLayout = ({ children }: { children: React.ReactNode }) => {
  const {  headerHeight } = useAppContext();

  return (
    <div style={{marginTop:headerHeight}}>
      {children}
    </div>
  );
};
