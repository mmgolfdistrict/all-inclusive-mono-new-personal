import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const useUpdateSearchParams = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const updateSearchParams = (
    keys: string[],
    values: string[],
    shouldScroll?: boolean
  ) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (keys.length !== values.length) {
      throw new Error("Keys and values must be the same length");
    }
    keys.forEach((key, index) => {
      // @ts-ignore
      current.set(key, values[index]);
    });
    // current.set(key, value);
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`, { scroll: shouldScroll });
  };
  return { updateSearchParams };
};
