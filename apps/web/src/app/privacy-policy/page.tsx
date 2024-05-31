'use client';

import { LoadingContainer } from "../[course]/loader";
import { api } from "~/utils/api";

export default function PrivacyPolicy() {
  const { data: privacyPolicies, isLoading } = api.user.getS3HtmlContent.useQuery({ keyName: 'privacypolicy.html' });

  return (
    <>
      <LoadingContainer isLoading={isLoading}>
        <div></div>
      </LoadingContainer>
      {privacyPolicies && (
        <main className="p-4 md:p-6 ">
          <div dangerouslySetInnerHTML={{ __html: JSON.stringify(privacyPolicies) }}></div>
        </main>
      )}
    </>
  );
}
