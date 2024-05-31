'use client';

import { api } from "~/utils/api";
import { LoadingContainer } from "../[course]/loader";

export default function TermsOfService() {
  const { data: termsOfServices, isLoading } = api.user.getS3HtmlContent.useQuery({ keyName: 'termsofservice.html' });

  return (
    <>
      <LoadingContainer isLoading={isLoading}>
        <div></div>
      </LoadingContainer>
      {termsOfServices && (
        <main className="p-4 md:p-6 ">
          <div dangerouslySetInnerHTML={{ __html: JSON.stringify(termsOfServices) }}></div>
        </main>
      )}
    </>
  );
}
