"use client";

import { Nav } from "~/components/nav/nav";
import { usePathname } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const Layout = ({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element => {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/forgot-password") {
    return <>{children}</>;
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-[1440px]">
        <Nav />
        <main
          id="sectionView"
          className="max-h-[100dvh] w-full overflow-auto py-10 px-12"
        >
          {children}
        </main>
      </div>
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
    </>
  );
};
