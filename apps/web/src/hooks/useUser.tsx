import { api } from "~/utils/api";
import { useMemo } from "react";

type UserType = {
  id: string;
  name: string | null;
  handle: string | null;
  email: string | null;
  emailVerified: string | null;
  image: string;
  gdImage: string | null;
  // location: string | null;
  address1: string | null;
  address2?: string | null;
  state: string | null;
  zipcode: string | null;
  city: string | null;
  country: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastSuccessfulLogin: string | null;
  balance: number;
  address: string | null;
  bannerImage: string | null;
  profileVisibility: "PUBLIC" | "PRIVATE";
  gdPassword: string | null;
  processorId: string | null;
  updatedEmail: string | null;
  secondFactor: string | null;
  forgotPasswordToken: string | null;
  forgotPasswordTokenExpiry: string | null;
  hyperswitchCustomerId: string | null;
  stripeConnectAccountId: string | null;
  phoneNotifications: boolean;
  phoneNumberCountryCode: number;
  phoneNumber: string | null;
  emailNotifications: boolean;
  verificationRequestToken: string | null;
  verificationRequestExpiry: string | null;
  entityId: string | null;
  profilePicture: string;
  bannerPicture: string;
  stripeConnectAccountStatus: "DISCONNECTED" | "CONNECTED";
  allowDeleteCreditCard: boolean;
};

export const useUser = (userId?: string) => {
  const {
    data: user,
    isLoading,
    refetch,
  } = api.user.getUser.useQuery(
    {
      userId: userId!,
    },
    {
      enabled: !!userId,
    }
  );
  const data = useMemo(() => {
    if (user) {
      return user as UserType;
    }
    return undefined;
  }, [user]);
  return { data, isLoading, refetch };
};
