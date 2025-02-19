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
        <p className="p-4">
            Current User Email: { user ? user.email : 'Not Logged In' }
        </p>
    </div>
  )
};