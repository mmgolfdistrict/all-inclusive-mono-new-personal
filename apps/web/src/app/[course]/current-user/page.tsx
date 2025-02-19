"use client";

import { useEffect } from "react";
import { useUserContext } from "~/contexts/UserContext";

export default function CurrentUser() {
  const { user } = useUserContext();

  useEffect(() => {
    if (user) {
      window.parent.postMessage({source: 'iframe-current-user', payload: user}, window.location.origin);
    }
  }, [user]);

  return (
    <div>
        <p>
            Current User Email: { user?.email }
        </p>
    </div>
  )
};