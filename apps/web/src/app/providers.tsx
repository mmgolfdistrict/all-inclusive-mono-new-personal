"use client";

import { UserWrapper } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SessionProvider } from "@golf-district/auth/nextjs-exports";
import { type EntityType } from "@golf-district/shared";
import { AppWrapper } from "~/contexts/AppContext";

function TRPCReactProvider(props: {
  children: React.ReactNode;
  entityData: EntityType | undefined;
  headers?: Headers;
}) {
  return (
    <SessionProvider>
      <AppWrapper entityData={props.entityData}>
        <UserWrapper>
          {props.children}
          <ToastContainer
            position="top-right"
            autoClose={9000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </UserWrapper>
      </AppWrapper>
    </SessionProvider>
  );
}

export default api.withTRPC(TRPCReactProvider) as typeof TRPCReactProvider;
