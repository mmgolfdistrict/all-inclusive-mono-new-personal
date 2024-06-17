import Link from "next/link";
import { GolfDistrict } from "../icons/golf-district";

export const Footer = () => {
  return (
    <div className="relative flex w-full flex-col-reverse gap-2 bg-primary p-6 text-sm text-white md:flex-row md:items-center md:justify-between md:p-8">
      <div>Copyright {new Date().getFullYear()}</div>
      <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 transform gap-1 md:flex items-center justify-center">
        <span className="text-[10px] md:text-[12px]">Powered by</span>
        {/* <img alt="golf district logo" src={`https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/desktopfooterlogo.png`} /> */}
      </div>
      <div className="flex flex-col items-start gap-2 md:items-end lg:flex-row lg:items-center">
        <Link href={`/faq`} data-testid="footer-help-id">
          FAQ
        </Link>
        <Link href={`/how-to-guide`} data-testid="footer-how-to-guide-id">
          How to Guide
        </Link>
        {/* <Link href={`/about-us`} data-testid="footer-about-us-id">
          About Us
        </Link> */}
        <Link href={`/privacy-policy`} data-testid="footer-privacy-policy-id">
          Privacy Policy
        </Link>
        <Link
          href={`/terms-of-service`}
          data-testid="footer-terms-of-service-id"
        >
          Terms of Service
        </Link>
      </div>
      <div className="flex items-center justify-center gap-1 md:hidden">
        <span className="text-[10px] md:text-[12px]">Powered by</span>
        <img
          alt="golf district logo"
          src={`https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/mobilefooterlogo.png`}
        />
      </div>
    </div>
  );
};
