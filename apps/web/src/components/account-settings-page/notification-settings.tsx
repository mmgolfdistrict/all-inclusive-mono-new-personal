"use client";

import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUser } from "~/hooks/useUser";
import { api } from "~/utils/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Switch } from "../buttons/switch";
import { useAppContext } from "~/contexts/AppContext";

export const NotificationSettings = () => {
  const [isByPhone, setIsByPhone] = useState<boolean>(true);
  const [isByEmail, setIsByEmail] = useState<boolean>(true);
  const { entity } = useAppContext();
  const updateUser = api.user.updateUser.useMutation();
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const { course } = useCourseContext();
  const courseId = course?.id ?? "";

  const params = useParams();
  const { userId } = params;
  const {
    data: userData,
    isLoading,
    refetch,
  } = useUser(userId as string | undefined);

  useEffect(() => {
    if (!isLoading && userData) {
      setIsByEmail(Boolean(userData?.emailNotifications));
      setIsByPhone(Boolean(userData?.phoneNotifications));
    }
  }, [isLoading, userData]);

  const updatePhoneNotifications = async (newValue: boolean) => {
    if (newValue === true && !userData?.phoneNumber) {
      toast.error("Please add a phone number to enable phone notifications");
      return;
    }
    if (isMutating) return;
    setIsByPhone(newValue);
    try {
      setIsMutating(true);
      await updateUser.mutateAsync({
        phoneNotifications: newValue,
        courseId,
        color1: entity?.color1 ?? "#40942A",
      });
      await refetch();
      toast.success("Phone notifications updated successfully");
      setIsMutating(false);
    } catch (error) {
      setIsMutating(false);
      toast.error(
        (error as Error).message ??
        "An error occurred updating phone notifications"
      );
    }
  };

  const updateEmailNotifications = async (newValue: boolean) => {
    return;
    if (isMutating) return;
    setIsByEmail(newValue);
    try {
      setIsMutating(true);
      await updateUser.mutateAsync({
        emailNotification: newValue,
        courseId,
        color1: entity?.color1 ?? "#40942A",
      });
      await refetch();
      toast.success("Email notifications updated successfully");
      setIsMutating(false);
    } catch (error) {
      setIsMutating(false);
      toast.error(
        (error as Error).message ??
        "An error occurred updating email notifications"
      );
    }
  };

  return (
    <section
      className="mx-auto flex h-fit w-full flex-col gap-6 bg-white px-3 py-2  md:rounded-xl md:p-6 md:py-4"
      // style={{ height: "49%" }}
      id="notifications-account-settings"
    >
      <div>
        <h3 className="text-[1.125rem] md:text-[1.5rem]">Notifications</h3>
        <p className="text-justify text-[0.875rem] text-primary-gray md:text-[1rem]">
          Set how you&apos;d like your receive notifications about your tee
          times.
        </p>
      </div>
      <div className="flex flex-row items-center gap-2">
        <Switch
          value={isByPhone}
          setValue={updatePhoneNotifications}
          data-testid={`update-phone-not-notification-id`}
        />
        <div className="text-justify text-[0.75rem] text-primary-gray md:text-[0.875rem]">
          By phone (messaging rates may apply)
        </div>
      </div>
      <div className="flex flex-row items-center gap-2">
        <Switch
          disabled={true}
          value={isByEmail}
          setValue={updateEmailNotifications}
          data-testid={`update-email-not-notification-id`}
        />
        <div className="text-[0.75rem] text-primary-gray md:text-[0.875rem]">
          By email
        </div>
      </div>
    </section>
  );
};

export const Item = ({
  value,
  className,
}: {
  value: string;
  className?: string;
}) => {
  return (
    <ToggleGroup.Item
      value={value}
      className={`bg-white px-4 py-2 text-left text-[0.875rem] text-primary-gray transition-colors data-[state=on]:bg-primary data-[state=on]:text-white ${className ?? ""}`}
    >
      {value}
    </ToggleGroup.Item>
  );
};
