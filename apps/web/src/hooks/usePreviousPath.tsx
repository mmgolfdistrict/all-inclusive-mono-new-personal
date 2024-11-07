import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSessionStorage } from "usehooks-ts";

export type Path = {
  path: string | null;
  createdAt: string;
};
export const usePreviousPath = () => {
  const [prevPath, setPrevPath] = useSessionStorage<Path | null>(
    "prevPath",
    null
  );
  const [currentPath, setCurrentPath] = useSessionStorage<Path | null>(
    "currentPath",
    null
  );
  const pathname = usePathname();

  const isPathExpired = (timeString: string | undefined) => {
    // const MAX_ALLOWED_DIFFERENCE = 10;

    // if (!timeString) return true;

    // const pathTime = new Date(timeString);

    // const now = new Date();
    // const difference =
    //   Math.abs(now.getTime() - pathTime.getTime()) / (1000 * 60);

    // if (difference > MAX_ALLOWED_DIFFERENCE) {
    //   return true;
    // }
    // redeploy
    return false;
  };

  const storePathValues = () => {
    const prev = {
      path: currentPath?.path ?? null,
      createdAt: new Date().toISOString(),
    };
    const current = {
      path: pathname,
      createdAt: new Date().toISOString(),
    };
    setPrevPath(prev);
    setCurrentPath(current);
  };

  useEffect(() => {
    if (prevPath?.path?.includes("checkout")) return;
    storePathValues();
  }, [pathname]);

  return { prevPath, setPrevPath, isPathExpired };
};
