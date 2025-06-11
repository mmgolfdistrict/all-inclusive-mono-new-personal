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
      className="block bg-white rounded-xl shadow-lg overflow-hidden"
      data-testid="course-id"
      data-test={courseId}
      data-qa={courseName}
    >
      <div className="relative">
        <Image
          draggable={false}
          src={image}
          width={440}
          height={288}
          alt="course"
          priority
          className="object-cover w-full h-[288px]"
          unoptimized
        />

        <div className="p-4 ">
          <div className="text-center">

            <button className=" bg-black text-white text-sm font-semibold px-4 py-2 rounded-xl border-2 border-white">
              Book Now
            </button>
          </div>
          <h3 className="text-lg text-center font-semibold mt-2">{courseName}</h3>
          <p className="text-gray-600 text-sm mt-1">{location}</p>
          <p className="text-justify text-gray-700 text-sm mt-4">{description}</p>
        </div>
      </div>
    </Link>
  );
};
