"use client";

import { api } from "~/utils/api";
import Image from "next/image";
import React from "react";

export default function SearchResults() {
  const { data, isLoading, isError, error } =
    api.user.getUpcomingTeeTimesForUser.useQuery({
      courseId: "5df5581f-6e5c-49af-a360-a7c9fd733f22",
      userId: "46ec2d5f-8cc4-4da1-9bde-40801f9279f6",
    });

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

  return null;
}
