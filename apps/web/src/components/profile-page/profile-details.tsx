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
          className="h-[140px] w-full object-cover md:h-[270px] md:rounded-t-xl"
        />
        <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 translate-y-[75%] flex-col items-end md:left-10 md:translate-x-10 md:translate-y-[50%] md:flex-row md:gap-4">
          <BlurImage
            src={userData?.profilePicture ?? placeholderBlurhash}
            width={userPlaceholder.width}
            height={userPlaceholder.height}
            unoptimized
            alt="banner"
            className="mx-auto h-[120px] w-[120px] rounded-full border-2 md:border-4 border-stroke object-cover md:h-[200px] md:w-[200px]"
          />
          <div className="flex flex-col gap-1 md:pb-3">
            <div className="flex flex-col items-center justify-center gap-1 text-[22px] md:flex-row md:gap-4 md:text-[32px]">
              <div className="text-secondary-black">
                {userData?.profileVisibility === "PRIVATE"
                  ? ""
                  : userData?.name}
              </div>
              <div className="-mt-2 text-primary-gray md:mt-0">
                {userData?.handle ?? ""}
              </div>
            </div>
            <div className="flex items-center gap-1 text-primary-gray">
              {userData?.location &&
              userData?.profileVisibility === "PUBLIC" ? (
                <>
                  <Location className="w-[16px] md:w-[22px]" />
                  <div>{userData?.location}</div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="h-[180px] w-full bg-white md:h-[150px] md:rounded-b-xl" />
      {isThirdPartyProfile && (
        <h1 className="flex justify-center mt-12 text-primary-gray text-lg">
          Profile Page Coming Soon…
        </h1>
      )}
    </div>
  );
};
