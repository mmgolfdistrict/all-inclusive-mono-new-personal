"use client";

import { useAppContext } from "~/contexts/AppContext";

export const Title = () => {
  const { entity ,mainHeaderHeight} = useAppContext();
  return (
    <>
      {!entity?.name ? (
        <div className="animate-pulse h-12 w-[50%] md:w-[35%] bg-gray-200 mx-auto md:mx-0 rounded-md mb-4 md:mb-6" />
      ) : (
        <h1
          className={`pb-4 text-center text-[24px] md:pb-6 md:text-center md:text-[32px]`}
          style={{marginTop: mainHeaderHeight}}
        >
          Welcome to {entity?.name}
        </h1>
      )}
    </>
  );
};
