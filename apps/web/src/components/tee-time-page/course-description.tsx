"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { truncate } from "~/utils/formatters";
import { useMemo, useState } from "react";
import { Carousel } from "react-responsive-carousel";
import { BlurImage } from "../images/blur-image";

export const CourseDescription = () => {
  const [isReadMore, setIsReadMore] = useState<boolean>(false);
  const { course } = useCourseContext();

  const description = course?.description ?? "";

  const toggleReadMore = () => {
    setIsReadMore(!isReadMore);
  };
  const courseImages = useMemo(() => {
    if (!course) return [];
    return course?.images;
  }, [course]);

  return (
    <div className="flex flex-col md:max-w-[550px]">
      <Carousel
        autoPlay
        showThumbs={false}
        showIndicators={true}
        swipeable={true}
        thumbWidth={500}
        showArrows={false}
        showStatus={false}
        infiniteLoop
        emulateTouch
        interval={3000}
        stopOnHover
        className="md:rounded-t-2xl"
      >
        {courseImages.map((image, idx) => (
          <ImageItem key={idx} src={image} />
        ))}
      </Carousel>
      <div className="flex flex-col gap-3 bg-white px-4 py-2 md:rounded-b-2xl">
        <div className="flex flex-col">
          <div className="text-lg">{course?.name}</div>
          <div>{course?.address}</div>
        </div>
        <div className="text-primary-gray">
          {description.length > 125 && !isReadMore
            ? truncate(description, 125)
            : description}
        </div>
        {description.length > 125 && (
          <button className="self-start text-primary" onClick={toggleReadMore}>
            {!isReadMore ? "Read More..." : "Read Less"}
          </button>
        )}
      </div>
    </div>
  );
};

const ImageItem = ({ src }: { src: string }) => {
  return (
    <div>
      <BlurImage
        src={src}
        width={500}
        height={270}
        alt="placeholder"
        className="h-[270px] w-[300px] object-cover md:rounded-t-2xl"
        unoptimized
      />
    </div>
  );
};
