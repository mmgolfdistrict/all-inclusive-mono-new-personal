import Image from "next/image";
import Link from "next/link";

export const Course = ({
  image,
  courseName,
  location,
  description,
  courseId,
}: {
  image: string;
  courseName: string;
  location: string;
  description: string;
  courseId: string;
}) => {
  return (
    <Link
      href={`/${courseId}`}
      className="flex w-full flex-col items-center gap-2 max-w-[720px] mx-auto"
      data-testid="course-id"
      data-test={courseId}
      data-qa={courseName}
    >
      <Image
        draggable={false}
        src={image}
        width={440}
        height={288}
        alt="course"
        priority
        className="object-cover rounded-md h-[288px] w-full bg-center"
        unoptimized
      />
      <button
        className={`absolute min-w-[110px] rounded-xl border-white border-[2px] bg-black px-7 py-3 mt-2 text-white`}
      >
        Book Now
      </button>
      <div className="flex flex-col gap-1">
        <div className="font-bold">{courseName}</div>
        <div>{location}</div>
        <div className=" text-sm text-justify font-[300]">{description}</div>
      </div>
    </Link>
  );
};
