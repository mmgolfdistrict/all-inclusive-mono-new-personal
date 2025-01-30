"use client";

import { Spinner } from "~/components/loading/spinner";
import { useAppContext } from "~/contexts/AppContext";
import { api } from "~/utils/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const Errors = {
  OAuthSignin: "Error in constructing an authorization URL",
  OAuthCallback: "Error in handling the response from an OAuth provider.",
  OAuthCreateAccount: "Could not create OAuth provider user in the database.",
  EmailCreateAccount: "Could not create email provider user in the database.",
  Callback: "Error in the OAuth callback handler route",
  CallbackRouteError:
    "The account is already associated with another user. You can link it from the account settings page if you use the original login method.",
  OAuthAccountNotLinked:
    "If the email on the account is already linked, but not with this OAuth account",
  EmailSignin: "Sending the e-mail with the verification token failed",
  CredentialsSignin:
    "The authorize callback returned null in the Credentials provider.",
  SessionRequired:
    "The content of this page requires you to be signed in at all times.",
  Default: "An error occurred in authorization.",
  AccessDenied:
    "Unable to login. Please call customer support at 877-TeeTrade or email at support@golfdistrict.com",
};

export default function AuthError() {
  const query = useSearchParams();
  const errorKey = query.get("error");
  const { entity } = useAppContext();
  const entityId = entity?.id;
  const router = useRouter();

  const { data } = api.entity.getCoursesByEntityId.useQuery(
    { entityId: entityId! },
    { enabled: entityId !== undefined }
  );

  useEffect(() => {
    if (errorKey === "AccessDenied" && data?.length) {
      router.push(`${data[0]?.id}/login?error=AccessDenied`);
    }
  }, [errorKey, router, data]);
  return (
    <>
      {errorKey === "AccessDenied" ? (
        <div style={{ height: "100vh" }}>
          <div className="flex justify-center items-center min-h-screen w-full">
            <Spinner className="w-[50px] h-[50px]" />
          </div>
        </div>
      ) : (
        <div className="flex items-center text-center flex-col justify-center mt-20">
          <h2 className="text-xl font-bold">
            {errorKey === "AccessDenied"
              ? "Access Denied"
              : "An Error Occurred"}
          </h2>
          <p className="pb-4 max-w-[400px]">
            {Errors[errorKey as keyof typeof Errors] ??
              "An error occurred in authorization."}
          </p>
          <Link href="/" className="underline" data-testid="return-home-id">
            Return Home
          </Link>
        </div>
      )}
    </>
  );
}
