"use client";

import type { Session } from "@golf-district/auth";
import { type QueryObserverResult } from "@tanstack/react-query";
import { type TRPCClientErrorLike } from "@trpc/client";
import { type BuildProcedure } from "@trpc/server";
import { useMe } from "~/hooks/useMe";
import { createContext, useContext, type ReactNode } from "react";

interface UserContextType {
  user: Session["user"] | undefined | null;
  isLoadingMe: boolean;
  refetchMe: () => Promise<
    QueryObserverResult<
      Session | null,
      TRPCClientErrorLike<BuildProcedure<"query", any, unknown>>
    >
  >;
}

const UserContext = createContext<UserContextType>({
  user: undefined,
  isLoadingMe: false,
  refetchMe: () =>
    Promise.resolve(
      {} as QueryObserverResult<
        Session | null,
        TRPCClientErrorLike<BuildProcedure<"query", any, unknown>>
      >
    ),
});

export const UserWrapper = ({ children }: { children: ReactNode }) => {
  const { user, refetch: refetchMe, isLoading: isLoadingMe } = useMe();

  const settings = {
    user,
    refetchMe,
    isLoadingMe,
  };

  return (
    <UserContext.Provider value={settings}>{children}</UserContext.Provider>
  );
};

export const useUserContext = () => {
  return useContext(UserContext);
};
