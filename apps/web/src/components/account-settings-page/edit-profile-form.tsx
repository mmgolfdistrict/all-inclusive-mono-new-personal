"use client";

import { useSession } from "@golf-district/auth/nextjs-exports";
import { zodResolver } from "@hookform/resolvers/zod";
import { FilledButton } from "~/components/buttons/filled-button";
import { DropMedia } from "~/components/input/drop-media";
import { Input } from "~/components/input/input";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { useUploadMedia } from "~/hooks/useUploadMedia";
import { useUser } from "~/hooks/useUser";
import {
  editProfileSchema,
  type EditProfileSchemaType,
} from "~/schema/edit-profile-schema";
import { api } from "~/utils/api";
import { debounceFunction } from "~/utils/debounce";
import { useParams } from "next/navigation";
import type { FormEvent } from "react";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";
import { useDebounce } from "usehooks-ts";
import { OutlineButton } from "../buttons/outline-button";

const defaultProfilePhoto = "/defaults/default-profile.webp";
const defaultBannerPhoto = "/defaults/default-banner.webp";

export const EditProfileForm = () => {
  // const [location, setLocation] = useState<string>("");
  const [address1, setAddress1] = useState<string>("");
  const [address2, setAddress2] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [zipcode, setZipcode] = useState<string>("");

  const { update } = useSession();
  const debouncedLocation = useDebounce<string>(city, 500);
  const { uploadMedia, isUploading } = useUploadMedia();
  const [banner, setBanner] = useState<string | null | undefined>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null | undefined>(
    null
  );
  const [assetIds, setAssetIds] = useState({
    bannerId: "",
    profilePictureId: "",
  });

  const {
    mutateAsync: checkProfanity,
    data: profanityCheckData,
    reset: resetProfanityCheck,
  } = api.profanity.checkProfanity.useMutation();
  const { mutate: deleteFileAsset } = api.upload.deleteFile.useMutation();
  const params = useParams();
  const { userId } = params;
  const { refetchMe } = useUserContext();
  const { course } = useCourseContext();
  const courseId = course?.id ?? "";

  const {
    data: userData,
    isLoading,
    refetch,
  } = useUser(userId as string | undefined);
  const updateUser = api.user.updateUser.useMutation();

  const cities = api.places.getCity.useQuery(
    { city: debouncedLocation },
    {
      enabled: !!debouncedLocation,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<EditProfileSchemaType>({
    // @ts-ignore
    resolver: zodResolver(editProfileSchema),
  });

  const upload = useCallback(
    async (file: File, type: "image" | "bannerImage") => {
      const data = await uploadMedia(file);

      if (!data) return;
      if (type === "image") {
        setProfilePhoto(data?.assetUrl);
        setAssetIds((prev) => ({ ...prev, profilePictureId: data.assetId }));
      }
      if (type === "bannerImage") {
        setBanner(data.assetUrl);
        setAssetIds((prev) => ({ ...prev, bannerId: data.assetId }));
      }
    },
    []
  );

  useEffect(() => {
    if (!isLoading && userData) {
      setValue("name", userData?.name ?? "");
      setValue("email", userData?.email ?? "");
      setValue("phoneNumber", userData?.phoneNumber ?? "");
      setValue("handle", userData?.handle ?? "");
      // setValue("location", userData?.location ?? "");
      setValue("address1", userData?.address1 ?? "");
      // setValue("address2", userData?.address2 ?? "");
      setValue("state", userData?.state ?? "");
      setValue("city", userData?.city ?? "");
      setValue("zipcode", userData?.zipcode ?? "");
      // setValue("country", userData?.country ?? "");
      setValue("profilePictureAssetId", userData?.image ?? "");
      setValue("bannerImageAssetId", userData?.bannerImage ?? "");
      setBanner(
        userData?.bannerPicture.includes("/defaults/")
          ? null
          : userData?.bannerPicture
      );
      setProfilePhoto(
        userData?.profilePicture.includes("/defaults/")
          ? null
          : userData?.profilePicture
      );
    }
  }, [isLoading, userData]);

  const image = watch("profilePictureAssetId");

  useEffect(() => {
    // @ts-ignore
    const imageFile = (image as FileList)?.[0];
    if (
      imageFile !== undefined &&
      imageFile?.size > 0 &&
      !isLoading &&
      userData &&
      userData?.image !== image
    ) {
      void upload(imageFile, "image");
    }
  }, [image, userData, isLoading]);

  const bannerImage = watch("bannerImageAssetId");

  useEffect(() => {
    // @ts-ignore
    const bannerFile = (bannerImage as FileList)?.[0];
    if (
      bannerFile !== undefined &&
      bannerFile?.size > 0 &&
      !isLoading &&
      userData &&
      userData?.bannerPicture !== bannerImage
    ) {
      void upload(bannerFile, "bannerImage");
    }
  }, [bannerImage, userData, isLoading]);

  const handle = watch("handle");

  const handleCheckProfanity = async (text: string) => {
    if (!text) return;
    const data = await checkProfanity({ text });
    if (data.isProfane) {
      setError("handle", {
        message: "Handle not available",
      });
    }
  };

  const debouncedHandleCheckProfanity = useCallback(
    debounceFunction(handleCheckProfanity, 500),
    []
  );

  useEffect(() => {
    if (!handle || handle?.length <= 2) {
      setError("handle", {
        message: "",
      });
      resetProfanityCheck();
      return;
    }
    setError("handle", {
      message: "",
    });
    debouncedHandleCheckProfanity(handle);
  }, [handle]);

  const getKeyFromAssetUrl = (url: string) => {
    const split = url.split("/");
    const key = split[split.length - 1];
    const splitKey = key?.split(".")[0];
    return splitKey;
  };

  const onSubmit: SubmitHandler<EditProfileSchemaType> = async (data) => {
    if (profanityCheckData?.isProfane) {
      setError("handle", {
        message: errors.handle?.message || "Handle not available",
      });
      return;
    }
    if (isUploading) return;

    try {
      const prevData = {
        name: userData?.name ?? "",
        email: userData?.email,
        handle: userData?.handle,
        // location: userData?.location,
        address1: userData?.address1,
        address2: userData?.address2,
        state: userData?.state,
        city: userData?.city,
        zipcode: userData?.zipcode,
        country: userData?.country,
        profilePictureAssetId: getKeyFromAssetUrl(userData?.image ?? ""),
        bannerImageAssetId: getKeyFromAssetUrl(userData?.bannerImage ?? ""),
      };
      const dataToUpdate = {
        name: data.name,
        email: data.email,
        handle: data.handle,
        // location: data.location,
        address1: data?.address1,
        // address2: data?.address2,
        state: data?.state,
        city: data?.city,
        zipcode: data?.zipcode,
        country: "USA", // data?.country,
        phoneNumber: data.phoneNumber,
        profilePictureAssetId:
          data.profilePictureAssetId === defaultProfilePhoto
            ? defaultProfilePhoto
            : assetIds.profilePictureId || undefined,
        bannerImageAssetId:
          data.bannerImageAssetId === defaultBannerPhoto
            ? defaultBannerPhoto
            : assetIds.bannerId || undefined,
      };
      const keys = Object.keys(dataToUpdate);

      keys.forEach((key) => {
        if (
          prevData[key as keyof typeof dataToUpdate] ===
          data[key as keyof typeof dataToUpdate]
        ) {
          // remove unchanged values
          delete dataToUpdate[key as keyof typeof dataToUpdate];
        }
        if (!dataToUpdate[key as keyof typeof dataToUpdate]) {
          //delete undefined values
          delete dataToUpdate[key as keyof typeof dataToUpdate];
        }
      });
      if (Object.keys(dataToUpdate).length === 0) {
        return;
      }
      //check if profilePictureAssetId is defaultProfilePhoto and then set it to empty string if it is
      if (dataToUpdate?.profilePictureAssetId === defaultProfilePhoto) {
        dataToUpdate.profilePictureAssetId = "";
        deleteFileAsset({ fileType: "profileImage" });
      }
      if (dataToUpdate?.bannerImageAssetId === defaultBannerPhoto) {
        dataToUpdate.bannerImageAssetId = "";
        deleteFileAsset({ fileType: "bannerImage" });
      }
      await updateUser.mutateAsync({ ...dataToUpdate, courseId });
      if (profilePhoto && profilePhoto !== defaultProfilePhoto) {
        setProfilePhoto(null);
        await update({ image: assetIds.profilePictureId });
        setAssetIds((prev) => ({ ...prev, profilePictureId: "" }));
      }
      if (profilePhoto && profilePhoto === defaultProfilePhoto) {
        await update({ image: "" });
        setProfilePhoto(null);
      }
      if (banner) {
        setBanner(null);
        setAssetIds((prev) => ({ ...prev, bannerId: "" }));
      }
      await refetchMe();
      await refetch();
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log(error);

      if (error?.message === "Handle already exists") {
        setError("handle", {
          type: "custom",
          message: "Handle already exists",
        });
      }

      toast.error(
        (error as Error)?.message ?? "An error occurred updating profile"
      );
    }
  };

  const resetProfilePicture = (e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setProfilePhoto(defaultProfilePhoto);
    setValue("profilePictureAssetId", defaultProfilePhoto);
  };

  const resetBanner = (e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setBanner(defaultBannerPhoto);
    setValue("bannerImageAssetId", defaultBannerPhoto);
  };

  return (
    <section className="mx-auto flex h-fit w-full flex-col bg-white px-3 py-2  md:rounded-xl md:p-6 md:py-4">
      <h1 className="pb-6  text-[18px]  md:text-[24px]">Account Information</h1>
      <form className="flex flex-col gap-2" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Name"
          type="text"
          placeholder="Enter your full name"
          id="name"
          name="name"
          register={register}
          error={errors.name?.message}
          data-testid="profile-name-id"
        />
        <Input
          label="Email"
          type="email"
          placeholder="Enter your email address"
          id="email"
          register={register}
          name="email"
          error={errors.email?.message}
          data-testid="profile-email-id"
          disabled={true}
        />
        <Input
          label="Phone Number"
          type="tel"
          placeholder="Enter your phone number"
          id="phoneNumber"
          register={register}
          name="phoneNumber"
          error={errors.phoneNumber?.message}
        />
        <Input
          label="Handle"
          className="w-full"
          type="text"
          placeholder="Enter your handle"
          id="handle"
          register={register}
          name={"handle"}
          error={errors.handle?.message}
          data-testid="profile-handle-id"
          showInfoTooltip={true}
          content="Handle must all be in lower case or numeric and must contain a minimum of 6 characters and maximum of 64 characters. Handle cannot contain special characters other than dot(.) and underscore(_) and any form of profanity or racism related content. Golf District reserves the right to change your handle to a random handle at any time if it violates our terms of service."
        />
        {/* <Input
          label="Location"
          type="text"
          list="places"
          placeholder="Start typing your city"
          id="location"
          register={register}
          name="location"
          error={errors.location?.message}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setLocation(e.target.value);
          }}
          data-testid="profile-location-id"
        /> */}
        <Input
          label="Address1"
          type="text"
          list="places"
          placeholder="Enter your address1"
          id="address1"
          register={register}
          name="address1"
          error={errors.address1?.message}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setAddress1(e.target.value);
          }}
          data-testid="profile-address1-id"
        />
        <Input
          label="Address2"
          type="text"
          list="places"
          placeholder="Enter your address2"
          id="address2"
          register={register}
          name="address2"
          // error={errors.address2?.message}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setAddress2(e.target.value);
          }}
          data-testid="profile-address2-id"
        />
        <Input
          label="City"
          type="text"
          list="places"
          placeholder="Enter your city"
          id="city"
          register={register}
          name="city"
          error={errors.city?.message}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setCity(e.target.value);
          }}
          data-testid="profile-city-id"
        />
        <Input
          label="State"
          type="text"
          list="places"
          placeholder="Enter your state"
          id="state"
          register={register}
          name="state"
          error={errors.state?.message}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setState(e.target.value);
          }}
          data-testid="profile-state-id"
        />
        <Input
          label="Zip"
          type="text"
          list="places"
          placeholder="Enter your zip"
          id="zipcode"
          register={register}
          name="zipcode"
          error={errors.zipcode?.message}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setZipcode(e.target.value);
          }}
          data-testid="profile-zipcode-id"
        />
        <Input
          label="Country"
          type="text"
          list="places"
          placeholder="Enter your country"
          id="country"
          register={register}
          name="country"
          disabled={true}
          value={"USA"}
          // error={errors.country?.message}
          showInfoTooltip={true}
          content="We only support cashouts for US banks at this time"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setCountry(e.target.value);
          }}
          data-testid="profile-country-id"
        />
        <datalist id="places">
          {cities.data?.autocompleteCities.features.map((city, idx) => (
            <option key={idx}>{city.place_name}</option>
          ))}
        </datalist>
        <div
          className={`flex items-end justify-between w-full gap-2 ${
            isUploading ? "pointer-events-none cursor-not-allowed" : ""
          }`}
        >
          <DropMedia
            label="Upload your profile photo"
            id="profilePictureAssetId"
            register={register}
            name={"profilePictureAssetId"}
            subtext="Suggested image size: 400x400px or larger"
            isUploading={isUploading && userData?.image !== image}
            src={profilePhoto}
            dataTestId="upload-profile-photo-id"
          />
          {userData?.profilePicture !== defaultProfilePhoto ? (
            <OutlineButton
              className="!px-2 !py-1 text-sm rounded-md"
              onClick={resetProfilePicture}
            >
              Reset
            </OutlineButton>
          ) : null}
        </div>

        <div
          className={`flex items-end justify-between w-full gap-2 ${
            isUploading ? "pointer-events-none cursor-not-allowed" : ""
          }`}
        >
          <DropMedia
            label="Upload your background photo"
            id="bannerImageAssetId"
            isBackgroundImage={true}
            register={register}
            name={"bannerImageAssetId"}
            subtext="Suggested image size: 1360x270px or larger"
            isUploading={isUploading && userData?.bannerImage !== bannerImage}
            src={banner}
            dataTestId="upload-background-photo-id"
          />
          {userData?.bannerImage &&
          userData?.bannerImage !== defaultBannerPhoto ? (
            <OutlineButton
              className="!px-2 !py-1 text-sm rounded-md"
              onClick={resetBanner}
            >
              Reset
            </OutlineButton>
          ) : null}
        </div>
        <FilledButton
          disabled={isSubmitting || isUploading}
          className={`w-full rounded-full ${
            isSubmitting || isUploading ? "opacity-50" : ""
          }`}
          data-testid="update-button-id"
        >
          {isSubmitting ? "Updating..." : "Update"}
        </FilledButton>
      </form>
    </section>
  );
};
