import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSessionStorage } from "usehooks-ts";

export const usePreviousPath = () => {
  const [prevPath, setPrevPath] = useSessionStorage<null | string>(
    "prevPath",
    null
  );
  const [currentPath, setCurrentPath] = useSessionStorage<null | string>(
    "currentPath",
    null
  );
  const pathname = usePathname();

  const storePathValues = () => {
    const prev = currentPath;
    setPrevPath(prev);
    setCurrentPath(pathname);
  };

  useEffect(() => {
    if (prevPath?.includes("checkout")) return;
    storePathValues();
  }, [pathname]);

  return { prevPath, setPrevPath };
};
