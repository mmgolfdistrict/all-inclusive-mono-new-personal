import { useEffect, useState } from "react";

export const useIsBrowser = () => {
  const [isBrowser, setIsBrowser] = useState<boolean>(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  return { isBrowser };
};
