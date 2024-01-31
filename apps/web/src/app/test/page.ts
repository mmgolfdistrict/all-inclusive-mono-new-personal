"use client";

import { api } from "~/utils/api";

// import Image from "next/image";
// import { userAgent } from "next/server";
// import React, { useEffect } from "react";

export default function test() {
  //   const test = api.cashOut.createStripeAccountLink.useMutation();
  //   const verify = async () => {
  //     await test.mutateAsync({ courseDomain: "https://github.com" });
  //   };
  const { data } = api.searchRouter.findBlackoutDates.useQuery({
    courseId: "5df5581f-6e5c-49af-a360-a7c9fd733f22",
  });
  console.log(data);
  // if (isLoading) {
  //   return <div style={{ textAlign: "center" }}>Loading...</div>;
  // }

  // if (isError && error) {
  //   return (
  //     <div style={{ color: "red", textAlign: "center" }}>
  //       Error: {error?.message}
  //     </div>
  //   );
  //}

  // if (!data || data.length === 0) {
  //   return <div style={{ textAlign: "center" }}>No tee times available.</div>;
  // }
  //   useEffect(() => {
  //     verify();
  //   }, []);
  return null;
}
