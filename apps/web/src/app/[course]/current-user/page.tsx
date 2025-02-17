"use client";

// import { useEffect } from 'react';

import { useUserContext } from "~/contexts/UserContext";

export default function CurrentUser() {
  const { user } = useUserContext();

  return (
    <div>
        <p>
            Current User Email: { user?.email }
        </p>
    </div>
  )
};
