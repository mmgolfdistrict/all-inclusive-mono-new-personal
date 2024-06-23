"use client";

import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { useUser } from "~/hooks/useUser";
import { api } from "~/utils/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useCourseContext } from "~/contexts/CourseContext";

const Options = ["PUBLIC", "PRIVATE"];
type OptionsType = "PUBLIC" | "PRIVATE";

export const PrivacySettings = () => {
  const [privacy, setPrivacy] = useState<OptionsType>("PUBLIC");
  const { userId } = useParams();
  const updateUser = api.user.updateUser.useMutation();
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const { course } = useCourseContext();
  const courseId = course?.id ?? "";

  const {
    data: userData,
    isLoading,
    refetch,
  } = useUser(userId as string | undefined);

  useEffect(() => {
    if (!isLoading && userData?.profileVisibility) {
      setPrivacy(userData.profileVisibility);
    }
  }, [userData, isLoading]);

  const choosePrivacy = async (value: OptionsType) => {
    if (isMutating) return;
    try {
      setIsMutating(true);
      await updateUser.mutateAsync({
        profileVisibility: value,
        courseId
      });
      await refetch();
      toast.success("Privacy settings updated successfully");
      setIsMutating(false);
    } catch (error) {
      setIsMutating(false);
      toast.error(
        (error as Error).message ??
          "An error occurred updating privacy settings"
      );
    }
  };

  return (
    <section
      className="h-inherit mx-auto flex w-full flex-col gap-6 bg-white px-3 py-2 mb-2  md:rounded-xl md:p-6 md:py-4"
      style={{ height: "49%" }}
    >
      <div>
        <h3 className="text-[18px]  md:text-[24px]">Privacy Settings</h3>
        <p className=" text-[14px] text-primary-gray md:text-[16px]">
          Set how you&apos;d like your profile information to appear.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2 lg:flex-row">
        <ToggleGroup.Root
          type="single"
          value={privacy}
          onValueChange={(p: OptionsType) => {
            if (p) setPrivacy(p);
          }}
          orientation="horizontal"
          className="flex"
          data-testid="privacy-button-id"
        >
          {Options.map((value: OptionsType, index) => (
            <Item
              key={index}
              value={value}
              choosePrivacy={choosePrivacy}
              className={`${
                index === 0
                  ? "rounded-l-full border-b border-l border-t border-stroke"
                  : index === Options.length - 1
                  ? "rounded-r-full border-b border-r border-t border-stroke"
                  : "border border-stroke"
              } px-[2.65rem] ${
                isMutating
                  ? "pointer-events-none animate-pulse cursor-not-allowed"
                  : ""
              }}`}
            />
          ))}
        </ToggleGroup.Root>
        <div className="text-[12px] text-primary-gray md:text-[14px]">
          {privacy === "PUBLIC"
            ? "Everything is visible, including tee time history."
            : "Your handle is public when you list a time for sale. All other information is not public."}
        </div>
      </div>
    </section>
  );
};

export const Item = ({
  value,
  className,
  choosePrivacy,
}: {
  value: OptionsType;
  choosePrivacy: (value: OptionsType) => Promise<void>;
  className?: string;
}) => {
  return (
    <ToggleGroup.Item
      value={value}
      onClick={() => void choosePrivacy(value)}
      className={`bg-white px-4 py-2 text-left capitalize text-[14px] text-primary-gray transition-colors data-[state=on]:bg-primary data-[state=on]:text-white ${
        className ?? ""
      }`}
      data-testid="toggle-item-id"
      data-qa={value}
    >
      {value.toLowerCase()}
    </ToggleGroup.Item>
  );
};
