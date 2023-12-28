"use client";

import { api } from "~/utils/api";
import Image from "next/image";
import React from "react";

export default function SearchResults() {
  // const { data, isLoading, isError, error } = api.weather.geForecast.useQuery({
  //   courseId: "5df5581f-6e5c-49af-a360-a7c9fd733f22",
  //   // startDate: new Date("2023-11-19"),
  //   // take: 1,
  //   // startTime: 1,
  //   // endTime: 2400,
  //   // holes: 18,
  //   // golfers: 4,
  //   // showUnlisted: true,
  //   // withCart: true,
  //   // lowerPrice: 0,
  //   // upperPrice: 100,
  //   // cursor: new Date("2023-11-20T04:59:59.999"),
  // });
  const { data, isLoading, isError, error } =
    api.searchRouter.getUnlistedTeeTimes.useQuery({
      teeTimeId: "030dacf5-7101-4727-bac9-375821e76356",
      ownerId: "1379f7c1-37d1-4c0c-b31d-38cf53cd4bc6",
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

  return (
    <div>hi</div>
    // <div
    //   style={{
    //     display: "flex",
    //     flexWrap: "wrap",
    //     gap: "20px",
    //     justifyContent: "center",
    //   }}
    // >
    //   {data.map((teeTime, index) => (
    //     <div
    //       key={index}
    //       style={{
    //         border: "1px solid #ddd",
    //         borderRadius: "8px",
    //         overflow: "hidden",
    //         width: "300px",
    //         margin: "10px",
    //         textAlign: "center",
    //       }}
    //     >
    //       {teeTime.purchasedByImage && (
    //         <Image
    //           src={teeTime.purchasedByImage}
    //           alt={teeTime.purchasedByName?.split(" ")[0] ?? "Golfer"}
    //           width={300}
    //           height={300}
    //           style={{ width: "100%", height: "auto" }}
    //         />
    //       )}
    //       <div style={{ padding: "16px" }}>
    //         <h5 style={{ marginTop: "0", color: "#333" }}>
    //           {teeTime.purchasedByName}
    //         </h5>
    //         <p style={{ color: "#555", margin: "5px 0" }}>
    //           Booking ID: {teeTime.bookingId}
    //         </p>
    //         <p style={{ color: "#555", margin: "5px 0" }}>
    //           Purchased By ID: {teeTime.purchasedById || "N/A"}
    //         </p>
    //         <p style={{ color: "#555", margin: "5px 0" }}>
    //           Purchased at: {teeTime.purchasedAt || "N/A"}
    //         </p>
    //         <p style={{ color: "#555", margin: "5px 0" }}>
    //           Purchase Amount: ${teeTime.purchaseAmount?.toFixed(2) || "N/A"}
    //         </p>
    //       </div>
    //     </div>
    //   ))}
    // </div>
  );
}
