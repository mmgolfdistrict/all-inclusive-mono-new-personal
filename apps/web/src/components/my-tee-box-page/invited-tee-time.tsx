import { api } from "~/utils/api";
import React from "react";

const InvitedTeeTime = () => {
  const { data, isLoading } = api.user.getInvitedUsers.useQuery({
    emailOrPhoneNumber: "saloni@yopamil.com",
  });

  console.log("data", data);

  return <div>InvitedTeeTime</div>;
};

export default InvitedTeeTime;
