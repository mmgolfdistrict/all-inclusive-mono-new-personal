"use client";

import { useUser } from "~/hooks/useUser";
import { placeholderBlurhash } from "~/utils/formatters";
import { useParams } from "next/navigation";
import bannerPlaceholder from "../../../public/placeholders/profile-banner.png";
import userPlaceholder from "../../../public/placeholders/profile-user.png";
import { Location } from "../icons/location";
import { BlurImage } from "../images/blur-image";

export const ProfileDetails = ({
  isThirdPartyProfile,
}: {
  isThirdPartyProfile: boolean;
}) => {
  const params = useParams();
  const { userId } = params;
  const { data: userData } = useUser(userId as string | undefined);

  return (
    <div>
      <div className="relative flex flex-col">
        <BlurImage
          src={userData?.bannerPicture ?? placeholderBlurhash}
          width={bannerPlaceholder.width}
          height={bannerPlaceholder.height}
          alt="banner"
          className="h-[8.75rem] w-full object-cover md:h-[16.875rem] md:rounded-t-xl"
        />
        <div className="w-full absolute bottom-0 flex justify-center items-center translate-y-[75%] flex-col md:items-end md:translate-x-10 md:translate-y-[50%] md:flex-row md:gap-4">
          <div className="md:w-2/12">
            <BlurImage
              src={userData?.profilePicture ?? placeholderBlurhash}
              width={userPlaceholder.width}
              height={userPlaceholder.height}
              unoptimized
              alt="banner"
              className="mx-auto h-[7.5rem] w-[7.5rem] rounded-full border-2 md:border-4 border-stroke object-cover md:h-[12.5rem] md:w-[12.5rem]"
            />
          </div>
          <div className="md:w-10/12 w-full flex flex-col gap-1 md:pb-3 md:justify-start justify-center">
            <div className="flex flex-col items-center md:justify-start justify-center gap-1 text-[1.375rem] md:flex-row md:gap-4 md:text-[2rem]">
              <div className="text-secondary-black">
                {!isThirdPartyProfile ||
                  (isThirdPartyProfile &&
                    userData?.profileVisibility !== "PRIVATE")
                  ? userData?.name
                  : ""}
              </div>
              <div className="-mt-2 text-primary-gray md:mt-0 whitespace-nowrap overflow-hidden text-ellipsis w-1/4 unmask-userdetails">
                {userData?.handle ?? ""}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[11.25rem] w-full bg-white md:h-[9.375rem] md:rounded-b-xl" />
      {isThirdPartyProfile && (
        <h1 className="flex justify-center mt-12 text-primary-gray text-lg">
          Profile Page Coming Soon…
        </h1>
      )}
    </div>
  );
};
