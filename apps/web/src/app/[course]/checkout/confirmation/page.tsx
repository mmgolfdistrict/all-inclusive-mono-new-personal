"use client";

import { Confirmation } from "~/components/checkout-page/confirmation";
import { BlurImage } from "~/components/images/blur-image";
import { CheckoutBreadcumbs } from "~/components/nav/checkout-breadcrumbs";
import { useCourseContext } from "~/contexts/CourseContext";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CheckoutConfirmation() {
  const { course } = useCourseContext();
  const params = useSearchParams();
  const teeTimeId = params.get("teeTimeId");
  const bookingId = params.get("bookingId");

  return (
    <div className="relative flex flex-col items-center gap-4 px-0 pb-8 md:px-8">
      <div className="h-12 w-full ">

      </div>
      <CheckoutBreadcumbs status={"confirmation"} />
      <Confirmation teeTimeId={teeTimeId!} bookingId={bookingId ?? ""} />
    </div>
  );
}
