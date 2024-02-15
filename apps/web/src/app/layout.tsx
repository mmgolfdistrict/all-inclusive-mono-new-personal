import { type ReactNode } from "react";
import "~/styles/globals.css";
import { ssrGetEntityByDomain } from "@golf-district/api";
import { Analytics } from "@vercel/analytics/react";
import { Layout } from "~/components/layout";
import { fontMapper } from "~/styles/fonts";
import { type Metadata } from "next";
import { headers } from "next/headers";
import Providers from "./providers";

const title = "Golf District Platforms";
const description = "Golf District Platforms";
// const image = "https://vercel.pub/thumbnail.png";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    // images: [image],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    // images: [image],
    creator: "@vercel",
  },
  metadataBase: new URL("https://vercel.pub"),
};

// export async function generateMetadata({
//   params,
// }: {
//   params: { domain: string };
// }): Promise<Metadata | null> {
//   const data = await getSiteData(params.domain);
//   if (!data) {
//     return null;
//   }
//   const {
//     name: title,
//     description,
//     image,
//     logo,
//   } = data as {
//     name: string;
//     description: string;
//     image: string;
//     logo: string;
//   };

//   return {
//     title,
//     description,
//     openGraph: {
//       title,
//       description,
//       images: [image],
//     },
//     twitter: {
//       card: "summary_large_image",
//       title,
//       description,
//       images: [image],
//       creator: "@vercel",
//     },
//     icons: [logo],
//     metadataBase: new URL(`https://${params.domain}`),
//   };
// }

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const host = headers().get("host");

  const domain = host?.split(":")?.[0]; //split on : to get localhost

  const domainDecoded = decodeURIComponent(domain!);

  const entityData = await ssrGetEntityByDomain(
    "golf-district-platform-git-foreup-int-solidity-frontend.vercel.app",
    ""
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontMapper[entityData?.font ?? "font-inter"]}`}>
        {!entityData?.id ? (
          <div className="flex items-center flex-col justify-center mt-20">
            <h2 className="font-bold">No Entity Found</h2>
            <p>There is no connected entity for this domain.</p>
          </div>
        ) : (
          <Providers entityData={entityData}>
            <Layout>
              <Analytics />
              {children}
            </Layout>
          </Providers>
        )}
      </body>
    </html>
  );
}
