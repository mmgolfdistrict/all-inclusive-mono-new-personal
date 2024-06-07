"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { useUser } from "~/hooks/useUser";
import { useEffect, useMemo } from "react";
import { Carousel } from "react-responsive-carousel";
import { BlurImage } from "../images/blur-image";

export const CourseBanner = ({
  userId,
  updateHandle,
  className,
}: {
  userId: string;
  updateHandle: () => void;
  className?: string;
}) => {
  const { course } = useCourseContext();
  const { data: userData } = useUser(userId as string | undefined);

  useEffect(() => {
    if (userData && !userData?.handle) {
      updateHandle();
    }
  }, [userData]);

  const courseImages = useMemo(() => {
    if (!course) return [];
    return course?.images;
  }, [course]);

  return (
    <Carousel
      autoPlay
      showThumbs={false}
      showIndicators={true}
      swipeable={true}
      thumbWidth={75}
      showArrows={false}
      showStatus={false}
      infiniteLoop
      emulateTouch
      interval={3000}
      stopOnHover
      className={className ?? ""}
    >
      {courseImages?.map((image, idx) => (
        <div key={idx}>
          <BlurImage
            src={image}
            width={1440}
            height={270}
            alt={course?.name ?? ""}
            className="object-cover w-full h-[270px]"
            unoptimized
          />
        </div>
      ))}
    </Carousel>
  );
};
