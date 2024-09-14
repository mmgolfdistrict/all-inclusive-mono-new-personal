"use client";

import { api } from "~/utils/api";
import { LoadingContainer } from "../[course]/loader";
import { GoBack } from "~/components/buttons/go-back";

export default function PrivacyPolicy() {
  const { data: privacyPolicies, isLoading } =
    api.user.getS3HtmlContent.useQuery({ keyName: "privacypolicy.html" });

  return (
    <>
      <LoadingContainer isLoading={isLoading}>
        <div></div>
      </LoadingContainer>
      <div className="flex items-center justify-between px-4 md:px-6 mt-8">
        <GoBack href={`/`} text={`Back`} />
      </div>
      {privacyPolicies && (
        <main className="bg-secondary-white py-4 md:py-6 ">
          <section className="mx-auto flex w-full flex-col pt-4 md:max-w-[1360px] md:gap-4 md:px-6">
            <div dangerouslySetInnerHTML={{ __html: privacyPolicies }}></div>
          </section>
        </main>
      )}
    </>
  );
}
