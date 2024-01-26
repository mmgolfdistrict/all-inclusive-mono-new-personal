import { useCourseContext } from "~/contexts/CourseContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GolfDistrict } from "../icons/golf-district";

export const Footer = () => {
  const { course } = useCourseContext();
  const pathname = usePathname();
  return (
    <div className="relative flex w-full flex-col-reverse gap-2 bg-primary p-6 text-sm text-white md:flex-row md:items-center md:justify-between md:p-8">
      <div>Copyright {new Date().getFullYear()}</div>
      <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 transform items-end gap-1 md:flex">
        <span>Powered by</span>
        <GolfDistrict id="1" className="w-[110px]" />
      </div>
      {pathname === "/" ? (
        <div />
      ) : (
        <div className="flex flex-col items-start gap-2 md:items-end lg:flex-row lg:items-center">
          <Link href={`/${course?.id}}/faq`}>Help</Link>
          <Link href={`/${course?.id}/about-us`}>About Us</Link>
          <Link href={`/${course?.id}/privacy-policy`}>Privacy Policy</Link>
          <Link href={`/${course?.id}/terms-of-service`}>Terms of Service</Link>
        </div>
      )}
      <div className="flex items-end gap-1 md:hidden">
        <span>Powered by</span>
        <GolfDistrict id="2" className="w-[110px]" />
      </div>
    </div>
  );
};
